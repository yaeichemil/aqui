console.log("Capstone Design web is running.");





// 탑 버튼
const topBtn = document.querySelector("#topBtn");

topBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
    });
});





// 01_hero ) 영상 재생
const heroVideo = document.querySelector(".hero_video");
const heroPlayBtn = document.querySelector(".hero_playbutton");

heroPlayBtn.addEventListener("click", () => {
    heroPlayBtn.style.display = "none";
    heroVideo.play();
});





// 01_hero ) 스크롤 유도 표지 등장
const heroScrollIndicator = document.querySelector("#hero .scroll_indicator");

heroVideo.addEventListener("ended", () => {
    heroScrollIndicator.classList.add("is-visible");
});





// 05 + 06 ) 스크롤 시퀀스
(() => {
    const sequence = document.querySelector("#device_service_sequence");
    if (!sequence) return;

    const stage = sequence.querySelector(".device_service_sticky");
    const deviceCopy = sequence.querySelector(".device_intro_copy_text");
    const deviceCopyParagraphs = [...sequence.querySelectorAll(".device_intro_copy_ko, .device_intro_copy_en")];
    const marker = sequence.querySelector(".before-service_mark");
    const dog = sequence.querySelector(".before-service_dog");
    const titles = [...sequence.querySelectorAll("[data-service-title]")];
    const descriptions = [...sequence.querySelectorAll("[data-service-description]")];
    const panels = [...sequence.querySelectorAll("[data-service-media]")];

    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const range = (a, b, v) => clamp((v - a) / (b - a));
    const smooth = (a, b, v) => {
        const t = range(a, b, v);
        return t * t * (3 - 2 * t);
    };
    const easeOut = (v) => 1 - Math.pow(1 - clamp(v), 3);

    // 06 HOME, CARE LOG, ARCHIVE 시작점. v3 스크롤 길이 유지.
    const swipeStarts = [0.585, 0.720, 0.855];
    const swipeLength = 0.082;

    // 원본 텍스트는 문단당 한 번만 보관합니다. 리사이즈할 때 줄을 재측정.
    const textParagraphs = [
        ...deviceCopyParagraphs,
        ...descriptions.flatMap((card) => [
            card.querySelector(".before-service_description_ko"),
            card.querySelector(".before-service_description_en")
        ])
    ].filter(Boolean);
    const textLines = new Map();
    const originalTexts = new Map();
    textParagraphs.forEach((paragraph) => {
        originalTexts.set(paragraph, paragraph.textContent.replace(/\s+/g, " ").trim());
    });

    // 브라우저가 실제로 만든 줄바꿈을 Range로 측정합니다.
    // 사용자는 HTML에서 한글 p / 영문 p만 수정하면 됩니다.
    function splitIntoLines(paragraph) {
        const source = originalTexts.get(paragraph);
        paragraph.textContent = source;
        const textNode = paragraph.firstChild;
        if (!textNode || !source) return [];

        const measurement = document.createRange();
        const lines = [];
        let lastTop = null;
        let start = 0;

        for (let i = 0; i < source.length; i++) {
            measurement.setStart(textNode, i);
            measurement.setEnd(textNode, i + 1);
            const rectangle = measurement.getBoundingClientRect();
            if (!rectangle.height) continue;
            const y = rectangle.top;

            if (lastTop !== null && Math.abs(y - lastTop) > 2) {
                lines.push(source.slice(start, i).trim());
                start = i;
            }
            lastTop = y;
        }
        lines.push(source.slice(start).trim());
        measurement.detach?.();

        const fragment = document.createDocumentFragment();
        const innerElements = [];
        lines.filter(Boolean).forEach((line) => {
            const outer = document.createElement("span");
            outer.className = "device_service_line";
            const inner = document.createElement("span");
            inner.className = "device_service_line_inner";
            inner.textContent = line;
            outer.appendChild(inner);
            fragment.appendChild(outer);
            innerElements.push(inner);
        });
        paragraph.replaceChildren(fragment);
        return innerElements;
    }

    function rebuildLines() {
        // 기존 애니메이션 속성이 측정에 영향을 주지 않도록 원문으로 되돌린 뒤 분리.
        textParagraphs.forEach((paragraph) => {
            paragraph.style.clipPath = "none";
            paragraph.style.transform = "none";
            paragraph.style.opacity = "1";
            textLines.set(paragraph, splitIntoLines(paragraph));
        });
        requestRender();
    }

    function showLine(line, amount) {
        if (!line) return;
        const t = clamp(amount);
        line.style.opacity = t.toFixed(3);
        line.style.transform = `translate3d(0, ${(106 * (1 - easeOut(t))).toFixed(2)}%, 0)`;
    }

    // p 하나 안에서도 줄별로 조금씩 시간차를 주며 드러납니다.
    function revealParagraph(paragraph, from, to, p, exitFrom = null, exitTo = null) {
        const lines = textLines.get(paragraph) || [];
        if (!lines.length) return;
        const stagger = Math.min(0.006, (to - from) / (lines.length + 2));
        lines.forEach((line, i) => {
            const enter = smooth(from + i * stagger, to + i * stagger, p);
            const exit = exitFrom === null ? 0 :
                smooth(exitFrom + (lines.length - i - 1) * stagger,
                       exitTo + (lines.length - i - 1) * stagger, p);
            showLine(line, enter * (1 - exit));
        });
    }

    // 05 본문: 처음 05 화면에 들어왔을 때 보임. 앞으로 스크롤하면
    // 아래로 조금 이동 → 행별 퇴장. 역방향 스크롤하면 위쪽 행부터 리빌.
    function renderDeviceCopy(p) {
        const drift = smooth(0.07, 0.265, p);
        deviceCopy.style.transform = `translate3d(0, ${(32 * drift).toFixed(2)}px, 0)`;
        let globalLine = 0;
        const totalLines = deviceCopyParagraphs.reduce((sum, element) =>
            sum + (textLines.get(element) || []).length, 0);
        deviceCopyParagraphs.forEach((paragraph) => {
            (textLines.get(paragraph) || []).forEach((line) => {
                // 첫 행부터 역방향으로 올라오도록 높은 진행률 쪽에 먼저 배치.
                const order = totalLines - 1 - globalLine;
                const exitStart = 0.212 + order * 0.004;
                const exitEnd = 0.260 + order * 0.004;
                showLine(line, 1 - smooth(exitStart, exitEnd, p));
                globalLine++;
            });
        });
    }

    function animateTitle(element, enterFrom, enterTo, p, exitFrom = null, exitTo = null) {
        if (!element) return;
        const enter = smooth(enterFrom, enterTo, p);
        const exit = exitFrom === null ? 0 : smooth(exitFrom, exitTo, p);
        const amount = enter * (1 - exit);
        element.style.opacity = amount.toFixed(3);
        element.style.transform = `translate3d(0, ${(26 * (1 - easeOut(enter)) - 5 * exit).toFixed(2)}px, 0)`;
        element.style.visibility = amount < 0.001 ? "hidden" : "visible";
    }

    function renderService(p) {
        // 네모와 첫 제목은 05 첫 화면에서 등장 후 06까지 같은 자리에 유지.
        marker.style.opacity = smooth(0.002, 0.035, p).toFixed(3);
        dog.style.opacity = smooth(0.429, 0.488, p).toFixed(3);

        descriptions.forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
            element.style.visibility = "visible";
        });

        // NFC Keyring은 05에서 나타나 06 NFC 화면까지 계속 유지.
        const firstExitA = swipeStarts[0] + swipeLength * 0.5;
        const firstExitB = swipeStarts[0] + swipeLength * 0.9;
        animateTitle(titles[0], 0.003, 0.045, p, firstExitA, firstExitB);

        // NFC 06 본문만 새로 나타납니다 (05 타이틀 중복 등장 없음).
        const firstDescription = descriptions[0];
        revealParagraph(firstDescription.querySelector(".before-service_description_ko"),
            0.438, 0.482, p, firstExitA, firstExitB);
        revealParagraph(firstDescription.querySelector(".before-service_description_en"),
            0.455, 0.506, p, firstExitA, firstExitB);

        // 06의 나머지 3개 화면은 타이틀 / 한글 / 영문 순서로 들어옵니다.
        for (let i = 1; i < 4; i++) {
            const enter = swipeStarts[i - 1] + swipeLength * 0.80;
            const exitA = i === 3 ? null : swipeStarts[i] + swipeLength * 0.5;
            const exitB = i === 3 ? null : swipeStarts[i] + swipeLength * 0.9;
            animateTitle(titles[i], enter, enter + 0.028, p, exitA, exitB);
            revealParagraph(descriptions[i].querySelector(".before-service_description_ko"),
                enter + 0.010, enter + 0.048, p, exitA, exitB);
            revealParagraph(descriptions[i].querySelector(".before-service_description_en"),
                enter + 0.023, enter + 0.064, p, exitA, exitB);
        }
    }

    function renderMedia(p) {
        const shrink = smooth(0.32, 0.425, p);
        stage.style.setProperty("--device_shrink", shrink.toFixed(4));
        // 최종 풀스크린 이미지에서는 scale이 적용되지 않음. 투명 PNG만 소폭 조정.
        stage.style.setProperty("--device_nfc_scale", lerp(1, 0.88, shrink).toFixed(4));

        panels.forEach((panel, i) => {
            const overlay = panel.querySelector(".device_service_media_overlay");
            if (i > 0) {
                const t = smooth(swipeStarts[i - 1], swipeStarts[i - 1] + swipeLength, p);
                panel.style.clipPath = `inset(${((1 - t) * 100).toFixed(3)}% 0 0 0)`;
                panel.style.transform = "none";
            }
            if (overlay) {
                // v3의 0.34보다 강하게 (0.64). 올라온 새 이미지는 어두워지지 않음.
                const opacity = i === 3 ? 0 :
                    0.64 * smooth(swipeStarts[i], swipeStarts[i] + swipeLength, p);
                overlay.style.opacity = opacity.toFixed(3);
            }
        });
    }

    function render(p) {
        renderDeviceCopy(p);
        renderMedia(p);
        renderService(p);
    }

    function getProgress() {
        const travel = Math.max(1, sequence.offsetHeight - window.innerHeight);
        return clamp(-sequence.getBoundingClientRect().top / travel);
    }

    let targetProgress = getProgress();
    let visibleProgress = targetProgress;
    let frameId = null;
    let lastTime = 0;

    function tick(time) {
        const delta = lastTime ? Math.min(80, time - lastTime) : 16;
        lastTime = time;
        visibleProgress += (targetProgress - visibleProgress) * (1 - Math.exp(-delta / 110));
        render(visibleProgress);
        if (Math.abs(targetProgress - visibleProgress) > 0.00008) {
            frameId = requestAnimationFrame(tick);
        } else {
            visibleProgress = targetProgress;
            render(visibleProgress);
            frameId = null;
            lastTime = 0;
        }
    }

    function requestRender() {
        targetProgress = getProgress();
        if (frameId === null) frameId = requestAnimationFrame(tick);
    }

    let resizeTimer;
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(rebuildLines, 130);
        requestRender();
    });
    window.addEventListener("pageshow", requestRender);
    window.addEventListener("load", () => { rebuildLines(); requestRender(); });

    rebuildLines();
    render(visibleProgress);
    // 웹폰트가 늦게 로드되면 실제 줄 수가 달라질 수 있으므로 재계산.
    if (document.fonts?.ready) document.fonts.ready.then(rebuildLines);
})();
