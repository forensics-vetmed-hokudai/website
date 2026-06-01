(() => {
  "use strict";

  const data = window.DiagnosisData;
  const app = document.querySelector("#app");

  if (!data || !app) {
    return;
  }

  const state = {
    step: "preSurvey",
    nickname: "",
    preSurvey: { cafe: null, touch: null },
    postSurvey: { cafe: null, touch: null },
    currentQuestion: 0,
    answers: [],
    resultId: null,
    shareUnlocked: false
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const displayName = () => state.nickname.trim() || "あなた";

  function absoluteUrl(path) {
    return new URL(path, data.site.baseUrl).toString();
  }

  function render() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });

    if (state.step === "preSurvey") renderPreSurvey();
    if (state.step === "name") renderName();
    if (state.step === "question") renderQuestion();
    if (state.step === "loading") renderLoading();
    if (state.step === "result") renderResult();

    if (state.step !== "name") {
      app.focus();
    }
  }

  function shell(html) {
    app.innerHTML = `<main class="page-shell">${html}</main>`;
  }

  function renderHero() {
    return `
      <section class="hero-section has-photo" aria-labelledby="page-title">
        <div class="hero-bg" aria-hidden="true">
          <img src="assets/img/hero/hero.webp" alt="" loading="eager" onerror="this.closest('.hero-bg').classList.add('is-missing-image'); this.remove();">
        </div>
        <div class="hero-copy">
          <p class="eyebrow">${escapeHtml(data.site.subsubtitle)}</p>
          <h1 id="page-title">エキゾチックアニマル<br>転生診断</h1>
          <p class="subtitle">${escapeHtml(data.site.subtitle)}</p>
          <a class="hero-scroll" href="#pre-survey-title">診断をはじめる</a>
        </div>
      </section>
    `;
  }

  function renderPreSurvey() {
    shell(`
      ${renderHero()}

      <section class="text-panel" aria-labelledby="about-diagnosis">
        <h2 id="about-diagnosis">診断説明</h2>
        <p>
          この診断は、あなたの性格に似たエキゾチックアニマルを表示する5問診断です。
          でも本当の目的は、かわいい動物たちが自然界でどんな暮らしをしていて、
          カフェやふれあい施設ではどんな行動が制限されやすいのかを知ることです。
          動物が好きだからこそ、近づく前に少しだけ知ってみませんか。
        </p>
      </section>

      <section class="survey-section" aria-labelledby="pre-survey-title">
        <h2 id="pre-survey-title">診断前アンケート</h2>
        ${renderSurvey("pre")}
        <button class="primary-button" id="pre-next" type="button" disabled>次へ</button>
      </section>

      <section class="notice-box" aria-labelledby="notice-title">
        <h2 id="notice-title">注意書き</h2>
        <p>${escapeHtml(data.disclaimer)}</p>
      </section>
    `);

    bindSurvey("pre");
    const next = document.querySelector("#pre-next");
    next.disabled = !state.preSurvey.cafe || !state.preSurvey.touch;
    next.addEventListener("click", () => {
      state.step = "name";
      render();
    });
  }

  function renderSurvey(prefix) {
    const current = prefix === "pre" ? state.preSurvey : state.postSurvey;

    return `
      <div class="survey-block" data-prefix="${prefix}">
        ${renderSurveyQuestion(prefix, "cafe", current.cafe)}
        ${renderSurveyQuestion(prefix, "touch", current.touch)}
      </div>
    `;
  }

  function renderSurveyQuestion(prefix, key, selected) {
    const item = data.survey[key];
    return `
      <fieldset class="choice-group">
        <legend>${escapeHtml(item.question)}</legend>
        <div class="option-grid">
          ${Object.entries(item.options)
            .map(([value, label]) =>
              renderSurveyOption(prefix, key, value, label, selected === value)
            )
            .join("")}
        </div>
      </fieldset>
    `;
  }

  function renderSurveyOption(prefix, key, value, label, selected) {
    return `
      <button
        class="option-card${selected ? " is-selected" : ""}"
        type="button"
        aria-pressed="${selected ? "true" : "false"}"
        data-survey-prefix="${escapeHtml(prefix)}"
        data-survey-key="${escapeHtml(key)}"
        data-survey-value="${escapeHtml(value)}"
      >
        ${escapeHtml(label)}
      </button>
    `;
  }

  function bindSurvey(prefix) {
    document
      .querySelectorAll(`[data-survey-prefix="${prefix}"]`)
      .forEach((button) => {
        button.addEventListener("click", () => {
          const target = prefix === "pre" ? state.preSurvey : state.postSurvey;
          target[button.dataset.surveyKey] = button.dataset.surveyValue;

          if (prefix === "post") {
            state.shareUnlocked = Boolean(state.postSurvey.cafe && state.postSurvey.touch);
            renderResult();
          } else {
            renderPreSurvey();
          }
        });
      });
  }

  function renderName() {
    shell(`
      <section class="name-section" aria-labelledby="name-title">
        <p class="eyebrow">Step 1</p>
        <h1 id="name-title">結果カードに表示する名前</h1>
        <div class="input-panel">
          <label for="nickname">ニックネーム</label>
          <input id="nickname" type="text" maxlength="20" autocomplete="off" value="${escapeHtml(state.nickname)}" placeholder="未入力なら「あなた」">
          <p class="small-note">入力したニックネームや回答は、外部送信・保存しません。このブラウザ内の表示だけに使います。</p>
        </div>
        <div class="button-row">
          <button class="secondary-button" type="button" id="back-pre">戻る</button>
          <button class="primary-button" type="button" id="start">5問診断をはじめる</button>
        </div>
      </section>
    `);

    const input = document.querySelector("#nickname");
    input.addEventListener("input", (event) => {
      state.nickname = event.target.value;
    });
    document.querySelector("#back-pre").addEventListener("click", () => {
      state.step = "preSurvey";
      render();
    });
    document.querySelector("#start").addEventListener("click", () => {
      state.step = "question";
      state.currentQuestion = 0;
      render();
    });
    input.focus();
  }

  function renderQuestion() {
    const index = state.currentQuestion;
    const question = data.questions[index];
    const saved = state.answers[index]?.choice;

    shell(`
      <section class="question-section" aria-labelledby="question-title">
        <p class="eyebrow">Question ${index + 1} / ${data.questions.length}</p>
        <div class="progress-bar" aria-hidden="true">
          <span style="width: ${((index + 1) / data.questions.length) * 100}%"></span>
        </div>
        <h1 id="question-title">${escapeHtml(question.text)}</h1>
        <div class="option-grid question-options">
          ${renderAnswer("A", question.optionA.label, saved)}
          ${renderAnswer("B", question.optionB.label, saved)}
        </div>
        <div class="button-row">
          <button class="secondary-button" type="button" id="question-back">${index === 0 ? "名前入力へ戻る" : "前の質問へ戻る"}</button>
        </div>
      </section>
    `);

    document.querySelectorAll("[data-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        saveAnswer(button.dataset.answer);
        if (state.currentQuestion < data.questions.length - 1) {
          state.currentQuestion += 1;
          render();
          return;
        }

        state.resultId = calculateResult();
        state.step = "loading";
        render();
        window.setTimeout(() => {
          state.step = "result";
          render();
        }, 3000);
      });
    });

    document.querySelector("#question-back").addEventListener("click", () => {
      if (state.currentQuestion === 0) {
        state.step = "name";
      } else {
        state.currentQuestion -= 1;
      }
      render();
    });
  }

  function renderAnswer(choice, label, selected) {
    return `
      <button class="option-card question-card${selected === choice ? " is-selected" : ""}" type="button" data-answer="${choice}" aria-pressed="${selected === choice ? "true" : "false"}">
        <span class="choice-mark">${choice}</span>
        <span>${escapeHtml(label)}</span>
      </button>
    `;
  }

  function saveAnswer(choice) {
    const question = data.questions[state.currentQuestion];
    const option = choice === "A" ? question.optionA : question.optionB;
    state.answers[state.currentQuestion] = {
      id: question.id,
      choice,
      scores: option.scores
    };
  }

  function calculateResult() {
    const scores = Object.fromEntries(Object.keys(data.results).map((id) => [id, 0]));
    state.answers.forEach((answer) => {
      Object.entries(answer.scores).forEach(([id, value]) => {
        scores[id] += value;
      });
    });

    return data.priority.reduce((best, id) => {
      if (scores[id] > scores[best]) return id;
      return best;
    }, data.priority[0]);
  }

  function renderLoading() {
    shell(`
      <section class="loading-section" aria-live="polite">
        <div class="loading-mark" aria-hidden="true"></div>
        <h1>${escapeHtml(data.site.loadingText)}</h1>
        <p>あなたの答えを、動物たちの自然な暮らしに重ねています。</p>
      </section>
    `);
  }

  function renderResult() {
    const result = data.results[state.resultId];
    if (!result) {
      state.step = "preSurvey";
      render();
      return;
    }

    shell(`
      <section class="result-section" aria-labelledby="result-title">
        <article class="result-card result-card--wild" id="resultCard">
          <div class="result-visual">
            <img
              src="${escapeHtml(result.animalImage)}"
              alt="${escapeHtml(result.displayName)}"
              class="result-photo"
              onerror="this.closest('.result-visual').classList.add('is-missing-image'); this.remove();"
            >
            <div class="result-visual-fallback">${escapeHtml(result.id.toUpperCase())}</div>
          </div>
          <div class="result-body">
            <p class="eyebrow">Result</p>
            <h1 id="result-title">${escapeHtml(displayName())}は<br>${escapeHtml(result.typeName)}</h1>
            <h2>${escapeHtml(result.title)}</h2>
            <p class="lead">${escapeHtml(result.intro)}</p>
            <div class="quiet-block">
              <h3>でも、知ってほしいこと</h3>
              <p>${escapeHtml(result.ache)}</p>
            </div>
            <div class="two-column">
              <div>
                <h3>自然では</h3>
                <p>${escapeHtml(result.nature)}</p>
              </div>
              <div>
                <h3>カフェでは</h3>
                <p>${escapeHtml(result.cafe)}</p>
              </div>
            </div>
            <div class="action-list">
              <h3>今日からできること</h3>
              <ol>
                ${result.actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}
              </ol>
            </div>
          </div>
        </article>
      </section>

      <section class="survey-section" aria-labelledby="post-survey-title">
        <h2 id="post-survey-title">診断後アンケート</h2>
        ${renderSurvey("post")}
        ${renderPostSurvey()}
        ${renderShare(result)}
      </section>

      <section class="detail-section" aria-labelledby="detail-title">
        <h2 id="detail-title">${escapeHtml(result.displayName)}について、もう少し知る</h2>
        <div class="detail-grid">
          ${renderDetail("福祉", "自然での暮らしとカフェでの行動制限", result.detail.welfare)}
          ${renderDetail("取引", "由来・流通の透明性", result.detail.trade)}
          ${renderDetail("保全", "野生個体群・生息地との関係", result.detail.conservation)}
          ${renderDetail("感染症", "One Healthの視点", result.detail.infection)}
        </div>
      </section>

      <section class="gallery-strip" aria-label="${escapeHtml(result.displayName)}の写真">
        <img src="assets/img/gallery/${escapeHtml(result.id)}-01.webp" alt="" loading="lazy" onerror="this.style.display='none'">
        <img src="assets/img/gallery/${escapeHtml(result.id)}-02.webp" alt="" loading="lazy" onerror="this.style.display='none'">
        <img src="assets/img/gallery/${escapeHtml(result.id)}-03.webp" alt="" loading="lazy" onerror="this.style.display='none'">
        <img src="assets/img/gallery/${escapeHtml(result.id)}-04.webp" alt="" loading="lazy" onerror="this.style.display='none'">
      </section>

      <section class="checklist-section" aria-labelledby="checklist-title">
        <h2 id="checklist-title">会いに行く前のチェックリスト</h2>
        <ul class="checklist">
          ${data.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>

      <section class="donation-section" aria-labelledby="donation-title">
        <h2 id="donation-title">獣医学の教育・研究を応援する</h2>
        <p>北海道大学獣医学部創立75周年記念事業基金へのご支援はこちらからお願いします。</p>
        <a class="primary-link-button" href="${escapeHtml(data.site.donationUrl)}" target="_blank" rel="noopener noreferrer">寄付ページを見る</a>
      </section>

      <section class="notice-box">
        <h2>注意書き</h2>
        <p>${escapeHtml(data.disclaimer)}</p>
      </section>

      <section class="restart-section">
        <button class="secondary-button" type="button" id="restart">もう一度診断する</button>
      </section>
    `);

    bindSurvey("post");
    bindShare(result);
    document.querySelector("#restart").addEventListener("click", reset);
  }

  function renderDetail(label, subtitle, body) {
    return `
      <article class="detail-card">
        <p class="detail-label">${escapeHtml(label)}</p>
        <div>
          <h3>${escapeHtml(subtitle)}</h3>
          <p>${escapeHtml(body)}</p>
        </div>
      </article>
    `;
  }

  function renderPostSurvey() {
    if (!state.postSurvey.cafe || !state.postSurvey.touch) {
      return `
        <div class="locked-message">
          <p>2問に回答すると、診断前後の変化とSNSシェアボタンが表示されます。</p>
        </div>
      `;
    }

    const beforeCafe = data.survey.cafe.options[state.preSurvey.cafe];
    const afterCafe = data.survey.cafe.options[state.postSurvey.cafe];
    const beforeTouch = data.survey.touch.options[state.preSurvey.touch];
    const afterTouch = data.survey.touch.options[state.postSurvey.touch];

    return `
      <div class="change-message">
        <h3>${escapeHtml(data.postSurveyMessage.title)}</h3>
        <p>${escapeHtml(data.postSurveyMessage.body)}</p>
        <dl class="comparison-list">
          <div>
            <dt>カフェに行ってみたいですか？</dt>
            <dd>${escapeHtml(beforeCafe)} → ${escapeHtml(afterCafe)}</dd>
          </div>
          <div>
            <dt>触ったり、抱っこしたりしてみたいですか？</dt>
            <dd>${escapeHtml(beforeTouch)} → ${escapeHtml(afterTouch)}</dd>
          </div>
        </dl>
      </div>
    `;
  }

  function renderShare(result) {
    if (!state.shareUnlocked) {
      return `
        <div class="share-area is-locked">
          <button class="primary-button" type="button" disabled>SNSシェアは回答後に有効になります</button>
        </div>
      `;
    }

    return `
      <div class="share-area">
        <p>${escapeHtml(data.postSurveyMessage.shareLead)}</p>
        <div class="share-buttons">
          <button class="primary-button" id="native-share" type="button">結果をシェア</button>
          <a class="secondary-link-button" id="x-share" href="#" target="_blank" rel="noopener noreferrer">Xでシェア</a>
          <a class="secondary-link-button" id="line-share" href="#" target="_blank" rel="noopener noreferrer">LINEで送る</a>
        </div>
      </div>
    `;
  }

  function bindShare(result) {
    if (!state.shareUnlocked) return;

    const shareText = `私は${result.displayName}タイプでした。かわいいだけじゃない、エキゾチックアニマルカフェの動物福祉のお話。`;
    const shareUrl = absoluteUrl(result.url);

    const xUrl = new URL("https://twitter.com/intent/tweet");
    xUrl.searchParams.set("text", shareText);
    xUrl.searchParams.set("url", shareUrl);

    const lineUrl = new URL("https://social-plugins.line.me/lineit/share");
    lineUrl.searchParams.set("url", shareUrl);

    document.querySelector("#x-share").href = xUrl.toString();
    document.querySelector("#line-share").href = lineUrl.toString();
    document.querySelector("#native-share").addEventListener("click", async () => {
      const payload = { title: data.site.title, text: shareText, url: shareUrl };
      if (navigator.share) {
        try {
          await navigator.share(payload);
        } catch (error) {
          return;
        }
      } else {
        try {
          await copyText(`${shareText}\n${shareUrl}`);
          document.querySelector("#native-share").textContent = "URLをコピーしました";
        } catch (err) {
          console.error("Failed to copy text: ", err);
        }
      }
    });
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function reset() {
    state.step = "preSurvey";
    state.nickname = "";
    state.preSurvey = { cafe: null, touch: null };
    state.postSurvey = { cafe: null, touch: null };
    state.currentQuestion = 0;
    state.answers = [];
    state.resultId = null;
    state.shareUnlocked = false;
    render();
  }

  render();
})();
