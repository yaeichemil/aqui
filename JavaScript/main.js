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





// 01_hero ) 스크롤 유도 표지 등장 및 숨김
const heroScrollIndicator = document.querySelector("#hero .scroll_indicator");


heroVideo.addEventListener("ended", () => {
    heroScrollIndicator.classList.add("is-visible");
});

heroVideo.addEventListener("play", () => {
    heroScrollIndicator.classList.remove("is-visible");
});





// 02 ) 갤러리 이미지 스크롤 등장 (한 번 나타나면 유지)
(() => {
    const overview = document.querySelector("#overview");
    if (!overview || overview.dataset.revealInitialized === "true") return;

    const cards = [...overview.querySelectorAll(
        ".overview_gallery > .overview_news_item, .overview_gallery > .overview_item"
    )];
    if (!cards.length) return;

    overview.dataset.revealInitialized = "true";

    // 스크롤 위치에 따라 등장하지만, 다시 위로 올라가도 사라지지 않음.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !("IntersectionObserver" in window)) return;

    overview.classList.add("is-reveal-ready");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.12,
        rootMargin: "0px 0px -6% 0px"
    });

    cards.forEach((card) => observer.observe(card));
})();





// 04_kkamsik ) Introduce 1 → 2 → 3 : 부드러운 세로 슬라이드
// 기존 '04_kkamsik ) 아래에서 올라와 풀스크린 → Introduce 1 / 2 / 3 스냅'
// 함수 블록 하나만 교체합니다.
// - 마스크 / clip-path / opacity 전환 없음
// - 브라우저 기본 스크롤을 막지 않음 (마우스 / 트랙패드 대응)
// - 스크롤 위치가 다음 구간에 도달하면 100vh씩 매끄럽게 슬라이드
// - 03→04 배경 진입 인터랙션 JS는 기존 코드 그대로 유지
(() => {
    const section = document.querySelector("#kkamsik");
    if (!section || section.dataset.motionInitialized === "true") return;

    const panels = [...section.querySelectorAll("[data-kkamsik-panel]")];
    if (panels.length !== 3) return;
    section.dataset.motionInitialized = "true";

    // 이 값은 04가 풀스크린으로 정착한 지점(0)부터 스크롤한 거리 / 화면 높이입니다.
    // 1 → 2: 약 1.08화면 뒤 / 2 → 3: 약 2.55화면 뒤.
    // CSS의 .kkamsik_scroll: 400vh와 함께 쓰는 설정입니다.
    // 3 전환 후에도 약 1.45화면 동안 풀스크린을 유지합니다.
    const step2At = 1.08; // Introduce 1을 충분히 보여준 뒤 2로 전환
    const step3At = 2.55; // Introduce 2도 충분히 머문 뒤 3으로 전환
    const buffer = 0.075; // 경계 부근 미세 왕복 방지 (화면 높이의 7.5%)

    let currentStep = -1;
    let requestId = null;

    function readStep(progress) {
        // 처음 실행하거나 새로고침/스크롤바 이동한 경우 현재 위치에서 바로 계산.
        if (currentStep < 0) {
            return progress < step2At ? 0 : progress < step3At ? 1 : 2;
        }

        // 방향이 바뀌더라도 경계 주변에서 1↔2↔3이 깜빡이지 않도록 여유를 둡니다.
        if (currentStep === 0) {
            return progress >= step3At + buffer ? 2
                 : progress >= step2At + buffer ? 1 : 0;
        }
        if (currentStep === 1) {
            return progress >= step3At + buffer ? 2
                 : progress < step2At - buffer ? 0 : 1;
        }
        return progress < step2At - buffer ? 0
             : progress < step3At - buffer ? 1 : 2;
    }

    function syncKkamsik() {
        requestId = null;

        const rect = section.getBoundingClientRect();
        const height = Math.max(1, window.innerHeight);
        const progress = -rect.top / height;
        const nextStep = readStep(progress);

        if (nextStep === currentStep) return;
        currentStep = nextStep;
        section.dataset.step = String(currentStep);

        panels.forEach((panel, index) => {
            panel.inert = index !== currentStep;
        });
    }

    function requestSync() {
        if (requestId !== null) return;
        requestId = requestAnimationFrame(syncKkamsik);
    }

    // wheel.preventDefault / 강제 scrollTo는 쓰지 않습니다.
    // 마우스와 트랙패드는 기본 스크롤 그대로. 긴 단계 간격으로 과민한 전환을 완화합니다.
    // 극단적으로 긴 단일 스와이프까지 무조건 한 단계로 제한하는 방식은 아닙니다.
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    window.addEventListener("pageshow", requestSync);
    syncKkamsik();
})();







// 04_kkamsik ) 03→04 배경 이미지 상단 리빌 (기존 진입 추가 JS와 교체)
// 사진을 확대하거나 좌우로 퍼뜨리지 않고, 수직 구도만 스크롤에 맞춰 드러냅니다.
// 04 Introduce 1→2→3 JS / 05~06 JS는 그대로 둡니다.
(() => {
    const section = document.querySelector("#kkamsik");
    if (!section) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    let requestId = null;

    function updateEntryReveal() {
        requestId = null;

        // 04 시작 지점이 뷰포트 아래에 있을 때 0,
        // 04가 뷰포트를 완전히 채워 sticky에 붙을 때 1.
        const viewportHeight = window.innerHeight;
        const sectionTop = section.getBoundingClientRect().top;
        const progress = clamp((viewportHeight - sectionTop) / viewportHeight, 0, 1);

        if (reducedMotion.matches) {
            section.style.setProperty("--kkamsik_entry_pan", "0px");
            return;
        }

        // 효과 강도: 0.18 = 화면 높이의 최대 18%를 위로 감춰둠.
        // 수치를 높이면 상단이 더 많이 가려졌다가 드러납니다.
        // 화면 높이에 따른 상한을 두어 노트북에서도 과해지지 않도록 함.
        const maxPan = Math.min(viewportHeight * 0.18, 180);
        const panY = -maxPan * (1 - progress);

        // easing 대신 실제 스크롤 진행률과 1:1로 연결:
        // 내리면 상단이 열리고, 다시 올리면 같은 속도로 닫힘.
        section.style.setProperty("--kkamsik_entry_pan", `${panY.toFixed(2)}px`);
    }

    function requestUpdate() {
        if (requestId === null) {
            requestId = requestAnimationFrame(updateEntryReveal);
        }
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("pageshow", requestUpdate);
    reducedMotion.addEventListener?.("change", requestUpdate);
    updateEntryReveal();
})();






// 05 + 06 ) 스크롤 시퀀스
// ======================================================================
// 05 Device → 06 Before-service : v12 (05 카피 최종 위치 + 첫 전환 스크롤 부담 완화)
//
// - 기존 v4 HTML/CSS 유지: main.js만 전체 교체
// - 05 카피: 한국어+영어 본문 전체가 화면에 들어온 이후 이동 시작.
//            05가 화면에 가득 찰 때 v4의 오른쪽 아래 위치에 정착.
// - 05 첫 NFC Keyring 제목: 시작 시 자동 재생 (스크롤 멈춰도 끝까지).
// - 06 제목/본문: 같은 속도의 독립적인 자동 등장. (줄마다 약한 시간차)
// - 새로운 미디어 50% 도달 시 새 텍스트 전환.
// - 미디어 마스크는 스크롤을 부드럽게 따라가고, 멈추면 같은 방향으로만
//   살짝 더 진행하다 정착합니다. 뒤로 튕기는 스프링 반동은 없습니다.
// - 실제 window.scrollY 자체는 절대 변경하지 않습니다.
// ======================================================================
(() => {
    const sequence = document.querySelector("#device_service_sequence");
    if (!sequence) return;

    // v5=850vh / v6=650vh. v5의 여유를 유지하며 아주 조금만 단축.
    // 전체 스크롤 길이를 바꾸려면 이 값만 수정하세요.
    sequence.style.height = "830vh";

    const stage = sequence.querySelector(".device_service_sticky");
    const deviceCopy = sequence.querySelector(".device_intro_copy_text");
    const deviceCopyGrid = sequence.querySelector(".device_intro_copy");
    const deviceParagraphs = [...sequence.querySelectorAll(".device_intro_copy_ko, .device_intro_copy_en")];
    const marker = sequence.querySelector(".before-service_mark");
    const dog = sequence.querySelector(".before-service_dog");
    const dogPhotos = [...sequence.querySelectorAll("[data-dog-photo]")];
    const titles = [...sequence.querySelectorAll("[data-service-title]")];
    const descriptions = [...sequence.querySelectorAll("[data-service-description]")];
    const panels = [...sequence.querySelectorAll("[data-service-media]")];
    if (!stage || !deviceCopy || !deviceCopyGrid || !marker || !dog ||
        titles.length !== 4 || descriptions.length !== 4 || panels.length !== 4) return;

    const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (a, b, p) => {
        if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
        const t = clamp((p - a) / (b - a));
        return t * t * (3 - 2 * t);
    };

    // ===== v12: 05→06 앞부분의 트리거만 조정 (후반 06은 그대로) =====
    // 아래 p값은 전체 05~06 스크롤 구간의 0~1 정규화 진행률입니다.
    // 05 본문은 여기까지는 계속 보이고, 이 지점을 지나면 560ms 동안 자동으로 사라집니다.
    // 페이드를 끝내기 위해 스크롤을 계속 굴릴 필요가 없습니다.
    const deviceFadeTrigger = 0.100; // v11 0.150 → 카피 정착 후 좀 더 빨리 자동 페이드
    const deviceFadeDuration = 560;

    // 05 페이드 이후 ~ 디바이스 Shrink까지의 대기만 줄입니다.
    // Shrink 자체의 길이(0.096)와 06 이후 미디어 스와이프는 그대로 유지.
    const shrinkStart = 0.170; // v11 0.270 → 페이드 이후 긴 스크롤 대기 단축
    const shrinkEnd = 0.266;   // 구간 길이 0.096 유지: shrink 속도 자체는 동일
    const swipeStarts = [0.585, 0.720, 0.855];
    const swipeLength = 0.100;          // v5 .082 / v6 .055
    const overlayDarkness = 0.90;       // 이전 미디어만 더 어둡게

    const serviceStart = 0.300;         // v11 0.410 → sticky 직후 본문 대기 단축
    const mediaHalf = swipeStarts.map((v) => v + swipeLength / 2);
    const serviceEntries = [serviceStart, ...mediaHalf];

    // 50% 기준 부근에서 스프링이 조금 흔들려도 텍스트가 왕복하지 않도록
    // 0.15%의 작은 완충 구간을 둡니다.
    const serviceHysteresis = 0.0005;

    // 마스크가 손끝에서 살짝 미끄러지는 느낌만 남깁니다.
    // 실제 스크롤 목표를 넘지 않는 단조(monotonic) 추종이라 용수철처럼 되돌아오지 않습니다.
    // 값↑ : 정착이 조금 더 느리고 부드러움 / 값↓ : 스크롤에 조금 더 즉각 반응.
    const followSeconds = 0.115;     // 0.10~0.16 사이에서 미세 조정 권장
    const followEpsilon = 0.00003;  // 눈에 띄지 않는 수준이면 정확한 목표값에 정착

    // 수정된 문구가 HTML에 반영되도록 원문을 저장합니다.
    const textParagraphs = [
        ...deviceParagraphs,
        ...descriptions.flatMap((card) => [
            card.querySelector(".before-service_description_ko"),
            card.querySelector(".before-service_description_en")
        ])
    ].filter(Boolean);
    const originalTexts = new Map();
    const textLines = new Map();
    const activeAnimations = new Map();
    textParagraphs.forEach((p) => originalTexts.set(p, p.textContent.replace(/\s+/g, " ").trim()));

    // 실제 화면의 줄바꿈을 측정해서 줄별 <span>을 만듭니다.
    // HTML에는 기존 p만 남겨두면 됩니다.
    function splitIntoLines(paragraph) {
        const source = originalTexts.get(paragraph) || "";
        paragraph.textContent = source;
        const node = paragraph.firstChild;
        if (!node || !source) return [];

        const range = document.createRange();
        const lines = [];
        let previousTop = null;
        let start = 0;
        for (let i = 0; i < source.length; i++) {
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const rect = range.getBoundingClientRect();
            if (!rect.height) continue;
            if (previousTop !== null && Math.abs(rect.top - previousTop) > 2) {
                lines.push(source.slice(start, i).trim());
                start = i;
            }
            previousTop = rect.top;
        }
        lines.push(source.slice(start).trim());
        range.detach?.();

        const fragment = document.createDocumentFragment();
        const result = [];
        lines.filter(Boolean).forEach((lineText) => {
            const outer = document.createElement("span");
            outer.className = "device_service_line";
            const inner = document.createElement("span");
            inner.className = "device_service_line_inner";
            inner.textContent = lineText;
            outer.appendChild(inner);
            fragment.appendChild(outer);
            result.push(inner);
        });
        paragraph.replaceChildren(fragment);
        return result;
    }

    function linesFor(paragraph) { return textLines.get(paragraph) || []; }
    function serviceLines(i) {
        return [
            ...linesFor(descriptions[i].querySelector(".before-service_description_ko")),
            ...linesFor(descriptions[i].querySelector(".before-service_description_en"))
        ];
    }
    function deviceLines() { return deviceParagraphs.flatMap((p) => linesFor(p)); }

    // 화면 밖에서 스크롤 점프/방향 반전 시 기존 애니메이션을 안전하게 취소.
    function stopAnimation(element) {
        const a = activeAnimations.get(element);
        if (a) {
            a.cancel();
            activeAnimations.delete(element);
        }
    }
    function stopLines(lines) { lines.forEach(stopAnimation); }
    function setLine(line, opacity, y = 0) {
        line.style.opacity = opacity.toFixed(3);
        line.style.transform = `translate3d(0, ${y}%, 0)`;
    }
    function hideLines(lines) {
        stopLines(lines);
        lines.forEach((line) => setLine(line, 0, 105));
    }
    function showLines(lines) {
        stopLines(lines);
        lines.forEach((line) => setLine(line, 1, 0));
    }

    // Web Animations API 사용 : 시작된 뒤에는 스크롤 위치와 무관하게 재생.
    function playRise(element, delay = 0, duration = 620, distance = 105) {
        stopAnimation(element);
        setLine(element, 0, distance);
        const a = element.animate([
            { opacity: 0, transform: `translate3d(0, ${distance}%, 0)` },
            { opacity: 1, transform: "translate3d(0, 0%, 0)" }
        ], {
            duration,
            delay,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
        });
        activeAnimations.set(element, a);
        a.onfinish = () => {
            if (activeAnimations.get(element) !== a) return;
            setLine(element, 1, 0);
            activeAnimations.delete(element);
            a.cancel(); // 마지막 프레임은 인라인 스타일로 유지
        };
    }

    function playTitleRise(title, duration = 505) {
        // 빠른 역주행/연속 전환 때 이미 보이던 제목을 갑자기 아래(26px)로
        // 되돌리지 않습니다. 현재 화면에 그려진 실제 위치에서 자연스럽게 이어갑니다.
        // 처음 등장하는 숨겨진 제목만 26px 아래에서 시작합니다.
        const computed = getComputedStyle(title);
        const currentOpacity = clamp(Number(computed.opacity) || 0);
        const currentTransform = computed.transform === "none"
            ? "translate3d(0, 0px, 0)" : computed.transform;
        const wasVisible = currentOpacity > 0.06;
        const fromTransform = wasVisible ? currentTransform : "translate3d(0, 26px, 0)";
        const fromOpacity = wasVisible ? currentOpacity : 0;

        stopAnimation(title);
        title.style.opacity = String(fromOpacity);
        title.style.transform = fromTransform;
        const a = title.animate([
            { opacity: fromOpacity, transform: fromTransform },
            { opacity: 1, transform: "translate3d(0, 0px, 0)" }
        ], {
            duration,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
        });
        activeAnimations.set(title, a);
        a.onfinish = () => {
            if (activeAnimations.get(title) !== a) return;
            title.style.opacity = "1";
            title.style.transform = "translate3d(0, 0px, 0)";
            activeAnimations.delete(title);
            a.cancel();
        };
    }

    // 텍스트가 반응형 레이아웃에서 줄 수가 달라져도 다시 맞도록 측정.
    let deviceInitialOffset = 0;
    let deviceTextVisible = true; // 특정 스크롤 지점에서만 전환. 중간 진행률에 묶이지 않음.
    let currentService = -1; // -1: 06 문구 전 / 0~3: NFC, HOME, CARE LOG, ARCHIVE
    const dogEnter = serviceStart; // 본문 등장 시점. 실제 강아지 등장은 본문 마지막 행 리빌 완료 후.
    let dogVisible = false;

    // 06 ) 타이틀 / 설명이 바뀔 때 바깥 dog 영역은 그대로 두고 이미지끼리 크로스페이드
    function setDogPhoto(index) {
        dogPhotos.forEach((photo, i) => photo.classList.toggle("is-active", i === index));
    }
    let serviceTransitionId = 0;
    let pendingServiceTimer = null;
    let pendingDogTimer = null;
    let firstTitleEntered = false;
    let deviceCopyHeight = 0;
    let deviceCopyInitialTop = 35;
    let deviceCopyFinalShift = 0; // +: 시안에 맞춰 아래로 / -: 화면 밖 잘림 방지로 위로
    let previousTarget = null;

    function measureDeviceOffset() {
        const oldTransform = deviceCopy.style.transform;
        deviceCopy.style.transform = "none";
        const finalRect = deviceCopy.getBoundingClientRect();
        const gridRect = deviceCopyGrid.getBoundingClientRect();
        // '05 최초 위치' = 05 그리드 맨 윗선 (피그마 y≈35px).
        // '05 마지막 위치' = 이미 v4에서 잡은 grid 10~12 / row 4~5.
        deviceInitialOffset = Math.max(0, finalRect.top - gridRect.top);
        deviceCopyHeight = finalRect.height;
        const stageRect = stage.getBoundingClientRect();
        deviceCopyInitialTop = gridRect.top - stageRect.top;

        // 05 시안처럼 '정착한 카피'를 기존보다 소폭 아래로 배치합니다.
        // (1920 기준 최대 약 50px, 노트북에서는 화면 비율에 따라 더 작게)
        // 하지만 카피 전체가 보여야 하므로, 화면 아래쪽 여유가 없으면 올려 보정합니다.
        const bottomGap = Math.min(42, Math.max(26, window.innerHeight * 0.045));
        const finalBottomWithinStage = finalRect.bottom - stageRect.top;
        const availableBelow = window.innerHeight - bottomGap - finalBottomWithinStage;
        const desiredDrop = Math.min(50, window.innerHeight * 0.055, window.innerWidth * 0.03);
        deviceCopyFinalShift = availableBelow >= 0
            ? Math.min(desiredDrop, availableBelow)
            : availableBelow;
        deviceCopy.style.transform = oldTransform;
    }

    function serviceIndexFor(p, previous = -1) {
        // 처음 로드하거나 멀리 점프하면 정확한 스크롤 위치를 그대로 사용.
        let result = -1;
        serviceEntries.forEach((entry, i) => { if (p >= entry) result = i; });
        if (previous < 0 || Math.abs(result - previous) > 1) return result;
        // 정확히 50% 부근에서 빠른 방향 전환 시 상태가 반복 전환되는 것 방지.
        if (result > previous &&
            (p < serviceEntries[result] + serviceHysteresis ||
             targetProgress < serviceEntries[result])) return previous;
        if (result < previous &&
            (p > serviceEntries[previous] - serviceHysteresis ||
             targetProgress >= serviceEntries[previous])) return previous;
        return result;
    }

    function rebuildLines() {
        activeAnimations.forEach((a) => a.cancel());
        activeAnimations.clear();
        textParagraphs.forEach((p) => {
            p.style.clipPath = "none";
            p.style.transform = "none";
            p.style.opacity = "1";
            textLines.set(p, splitIntoLines(p));
        });
        measureDeviceOffset();
        const p = getProgress();
        deviceTextVisible = p < deviceFadeTrigger;
        deviceCopy.style.opacity = deviceTextVisible ? "1" : "0";
        if (deviceTextVisible) showLines(deviceLines());
        else hideLines(deviceLines());
        currentService = serviceIndexFor(p);
        setDogPhoto(Math.max(0, currentService));
        // 새로고침/리사이즈 시 현재 06 화면에서는 정적인 완료 상태로 복원.
        dogVisible = currentService >= 0;
        dog.style.opacity = dogVisible ? "1" : "0";
        clearTimeout(pendingServiceTimer);
        clearTimeout(pendingDogTimer);
        serviceTransitionId++;
        const rect = sequence.getBoundingClientRect();
        firstTitleEntered = rect.top <= window.innerHeight * 0.72;
        marker.style.opacity = firstTitleEntered ? "1" : "0";
        titles[0].style.opacity = firstTitleEntered && currentService <= 0 ? "1" : "0";
        titles[0].style.transform = firstTitleEntered
            ? "translate3d(0, 0, 0)" : "translate3d(0, 26px, 0)";
        descriptions.forEach((card, i) => {
            card.style.opacity = i === currentService ? "1" : "0";
            card.style.visibility = "visible";
            card.style.transform = "none";
            if (i === currentService) showLines(serviceLines(i));
            else hideLines(serviceLines(i));
            if (i > 0) {
                titles[i].style.opacity = i === currentService ? "1" : "0";
                titles[i].style.transform = i === currentService
                    ? "translate3d(0, 0px, 0)" : "translate3d(0, 26px, 0)";
            }
        });
        previousTarget = p;
        targetProgress = p;
        visibleProgress = p;
        render(p);
        requestRender();
    }

    // 05 : 특정 지점에서 자동으로 fade out (스크롤 정지 후에도 완료).
    function fadeDeviceCopy() {
        deviceTextVisible = false;
        stopAnimation(deviceCopy);
        const from = Number(getComputedStyle(deviceCopy).opacity);
        const a = deviceCopy.animate([
            { opacity: Number.isFinite(from) ? from : 1 },
            { opacity: 0 }
        ], {
            duration: deviceFadeDuration,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "forwards"
        });
        activeAnimations.set(deviceCopy, a);
        a.onfinish = () => {
            if (activeAnimations.get(deviceCopy) !== a) return;
            deviceCopy.style.opacity = "0";
            activeAnimations.delete(deviceCopy);
            a.cancel();
            if (!deviceTextVisible) hideLines(deviceLines());
        };
    }

    // 05 : 역주행 시 윗줄부터 자동으로 리빌 (스크롤을 멈춰도 완료).
    function startDeviceReverse() {
        deviceTextVisible = true;
        stopAnimation(deviceCopy);
        deviceCopy.style.opacity = "1";
        deviceLines().forEach((line, index) => playRise(line, index * 65, 600));
    }

   // 06 ) 한글 / 영문 본문 동시 리빌
function startServiceReveal(i, transitionId) {
    const card = descriptions[i];

    stopAnimation(card);
    card.style.opacity = "1";
    card.style.visibility = "visible";

    const korean = linesFor(card.querySelector(".before-service_description_ko"));
    const english = linesFor(card.querySelector(".before-service_description_en"));

    const riseDuration = 650;
    const riseDelay = 75;
    const lineDelay = 64;

    if (i > 0) playTitleRise(titles[i], riseDuration);

    // 한글과 영문은 동시에 시작하고, 각 언어의 줄은 순차적으로 등장
    korean.forEach((line, index) => {
        playRise(line, riseDelay + index * lineDelay, riseDuration);
    });

    english.forEach((line, index) => {
        playRise(line, riseDelay + index * lineDelay, riseDuration);
    });

    // 첫 한국어 행이 올라오기 시작할 때 깜식이 사진도 등장
    if (!dogVisible) {
        clearTimeout(pendingDogTimer);

        pendingDogTimer = setTimeout(() => {
            if (transitionId !== serviceTransitionId || currentService < 0) return;

            setDogVisible(true);
        }, 135);
    }
}

    // 퇴장 역시 시간 기반 fade. 스크롤을 멈춰도 흐릿한 글자가 남지 않습니다.
    function fadeOut(element, duration = 220, onFinish = null) {
        const computed = getComputedStyle(element);
        const opacity = Number(computed.opacity) || 0;
        const isTitle = element.matches(".before-service_title");
        // 제목에 걸린 rise 애니메이션을 취소해도 위치가 시작점으로 튀지 않게
        // 취소 *직전*에 실제 화면에 보이던 transform을 저장합니다.
        const currentTransform = isTitle ? computed.transform : null;
        stopAnimation(element);
        if (isTitle) {
            element.style.transform = currentTransform === "none"
                ? "translate3d(0, 0px, 0)" : currentTransform;
        }
        if (opacity < 0.02) {
            element.style.opacity = "0";
            // 완전히 숨긴 뒤 위치를 초기화하면 사용자 눈에는 점프가 보이지 않음.
            if (isTitle) element.style.transform = "translate3d(0, 0px, 0)";
            if (onFinish) onFinish();
            return;
        }
        const a = element.animate([
            { opacity },
            { opacity: 0 }
        ], {
            duration,
            easing: "cubic-bezier(0.4, 0, 1, 1)",
            fill: "forwards"
        });
        activeAnimations.set(element, a);
        a.onfinish = () => {
            if (activeAnimations.get(element) !== a) return;
            element.style.opacity = "0";
            // 제목이 투명해진 *다음* 위치를 리셋합니다.
            if (isTitle) element.style.transform = "translate3d(0, 0px, 0)";
            activeAnimations.delete(element);
            a.cancel();
            if (onFinish) onFinish();
        };
    }

    function hideService(i) {
        fadeOut(descriptions[i], 220, () => hideLines(serviceLines(i)));
        if (i > 0) fadeOut(titles[i], 235);
    }

    // 05~06이 공유하는 첫 NFC Keyring 제목만 별도로 빠르게 전환.
    function changeFirstTitle(visible) {
        const first = titles[0];
        const computed = getComputedStyle(first);
        const opacity = Number(computed.opacity) || 0;
        // 05에서 진행 중인 첫 타이틀의 상승을 취소할 때도 위치를 보존.
        const currentTransform = computed.transform;
        stopAnimation(first);
        first.style.transform = currentTransform === "none"
            ? "translate3d(0, 0px, 0)" : currentTransform;
        if (!visible && opacity < 0.02) { first.style.opacity = "0"; return; }
        if (visible && opacity > 0.98) { first.style.opacity = "1"; return; }
        const end = visible ? 1 : 0;
        const a = first.animate([{ opacity }, { opacity: end }], {
            duration: 250,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards"
        });
        activeAnimations.set(first, a);
        a.onfinish = () => {
            if (activeAnimations.get(first) !== a) return;
            first.style.opacity = String(end);
            if (!visible) first.style.transform = "translate3d(0, 0px, 0)";
            activeAnimations.delete(first);
            a.cancel();
        };
    }

    // 06 텍스트 교체:
    // 1) 새 미디어가 50% 드러나면 기존 제목+본문 전체를 페이드아웃
    // 2) 퇴장이 완전히 끝난 다음 새 제목+본문의 행별 자동 리빌 시작
    // 빠른 연속 스크롤에서도 이전 예약 재생이 나오지 않도록 세대 ID로 보호.
    function switchService(next) {
        if (next === currentService) return;
        const previousService = currentService;
        currentService = next;
        const transitionId = ++serviceTransitionId;
        clearTimeout(pendingServiceTimer);
        clearTimeout(pendingDogTimer);
        // 첫 NFC 설명에 들어갈 때는 아직 사라질 06 텍스트가 없으므로 대기를 짧게.
        // HOME·CARE LOG·ARCHIVE 사이의 퇴장 시간(350ms)은 기존처럼 유지.
        const fadeDuration = previousService === -1 && next === 0 ? 160 : 350;

        // 글자 하나하나가 자동 애니메이션 중이어도 우선 기존 묶음 전체가 사라짐.
        descriptions.forEach((card, i) => {
            fadeOut(card, fadeDuration, () => {
                // 같은 요소가 새로운 전환에서 다시 사용되는 경우 지연 콜백 무시.
                if (transitionId === serviceTransitionId) hideLines(serviceLines(i));
            });
        });
        titles.slice(1).forEach((title) => fadeOut(title, fadeDuration));

        // 첫 타이틀은 05와 공유하므로 05에서는 유지.
        if (next >= 1) changeFirstTitle(false);
        if (next < 0) {
            // 06에서 05로 역주행하면 공유 NFC Keyring 제목은 다시 표시.
            if (firstTitleEntered) changeFirstTitle(true);
            setDogVisible(false);
            return;
        }

        // 페이드가 끝나고 다음 본문이 시작되므로, 화면에 겹쳐 보일 수 없음.
        pendingServiceTimer = setTimeout(() => {
            if (transitionId !== serviceTransitionId || currentService !== next) return;
            if (next === 0) changeFirstTitle(true);
            setDogPhoto(next); // 새로운 타이틀 등장 시점과 사진 교체를 동기화
            startServiceReveal(next, transitionId);
        }, fadeDuration + 30);
    }

    // 멍멍이 사진은 06 첫 본문의 첫 행과 거의 동시에 나타납니다.
    // 06 섹션을 빠져나가면 짧게 사라지며, 같은 방향으로 부드럽게 종료합니다.
    function setDogVisible(visible) {
        if (visible === dogVisible) return;
        dogVisible = visible;
        const from = Number(getComputedStyle(dog).opacity) || 0;
        stopAnimation(dog);
        const to = visible ? 1 : 0;
        const a = dog.animate([{ opacity: from }, { opacity: to }], {
            duration: visible ? 570 : 420,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards"
        });
        activeAnimations.set(dog, a);
        a.onfinish = () => {
            if (activeAnimations.get(dog) !== a) return;
            dog.style.opacity = String(to);
            activeAnimations.delete(dog);
            a.cancel();
        };
    }

    function updateDog(p) {
        // 본문을 보기 전에는 사진을 보여주지 않습니다.
        // 입장 지점에서는 startServiceReveal()이 첫 행 시작 후 사진을 표시.
        if (p < dogEnter - 0.004) {
            clearTimeout(pendingDogTimer);
            setDogVisible(false);
        }
    }

    // 05 진입 시 첫 타이틀은 스크롤 거리 대신 시간으로 애니메이션됩니다.
    // 05가 약 28% 정도 화면에 들어온 시점에 시작 (제목은 끝까지 재생).
    function updateFirstTitleEntrance() {
        const rect = sequence.getBoundingClientRect();
        const shouldEnter = rect.top <= window.innerHeight * 0.72 && rect.bottom > 0;
        if (shouldEnter && !firstTitleEntered) {
            firstTitleEntered = true;
            if (currentService <= 0) playTitleRise(titles[0], 630);
            marker.style.opacity = "0";
            stopAnimation(marker);
            const markerAnimation = marker.animate([
                { opacity: 0 }, { opacity: 1 }
            ], { duration: 500, easing: "ease-out", fill: "forwards" });
            activeAnimations.set(marker, markerAnimation);
            markerAnimation.onfinish = () => {
                if (activeAnimations.get(marker) !== markerAnimation) return;
                marker.style.opacity = "1";
                activeAnimations.delete(marker);
                markerAnimation.cancel();
            };
        } else if (!shouldEnter && firstTitleEntered && rect.top > window.innerHeight * 0.84) {
            // 04로 완전히 되돌아왔을 때는 다음 05 진입을 위해 초기화.
            firstTitleEntered = false;
            stopAnimation(titles[0]);
            stopAnimation(marker);
            titles[0].style.opacity = "0";
            titles[0].style.transform = "translate3d(0, 26px, 0)";
            marker.style.opacity = "0";
        }
    }

    // 스크롤 이벤트는 위치/방향만 판단합니다. 문장 전환은 WAAPI가 수행합니다.
    function updateTriggers(p) {
        if (previousTarget === null) { previousTarget = p; return; }
        if (Math.abs(p - previousTarget) < 0.00002) return;
        const up = p < previousTarget;

        // 실제 스크롤 진행률로 '진입 여부'만 감지하고,
        // 페이드/행별 리빌 그 자체는 독립적으로 끝까지 자동 재생합니다.
        if (p >= deviceFadeTrigger && deviceTextVisible && !up) {
            fadeDeviceCopy();
        } else if (p < deviceFadeTrigger && !deviceTextVisible && up) {
            startDeviceReverse();
        }
        switchService(serviceIndexFor(p, currentService));
        updateDog(p);
        previousTarget = p;
    }

    // 05가 보이는 순간 바로 카피를 움직이지 않습니다.
    // 한국어/영어를 포함한 copy 전체가 화면 안에 들어온 뒤부터 움직여
    // 05 상단이 viewport 상단에 닿았을 때 최종 위치에 도착합니다.
    function getDeviceEntryProgress() {
        const stageTop = sequence.getBoundingClientRect().top;
        const viewport = Math.max(1, window.innerHeight);
        const desiredBottomGap = Math.min(36, viewport * 0.035);
        const startStageTop = Math.max(1,
            viewport - deviceCopyInitialTop - deviceCopyHeight - desiredBottomGap);
        return smooth(0, 1, (startStageTop - stageTop) / startStageTop);
    }

    function renderDeviceCopy(p) {
        const move = getDeviceEntryProgress();
        // 처음에는 피그마 상단 위치. 화면을 채워 갈수록 시안 하단으로 내려옵니다.
        // 최종 위치는 + 방향으로 조금 낮추되, 카피가 잘리면 자동으로 위로 보정합니다.
        const shiftY = -(1 - move) * deviceInitialOffset + move * deviceCopyFinalShift;
        deviceCopy.style.transform = `translate3d(0, ${shiftY.toFixed(2)}px, 0)`;
        // opacity는 updateTriggers()에서 지점 통과 시 자동 재생하므로 이곳에서 건드리지 않음.
    }

    function renderService(p) {
        // 네모와 첫 타이틀은 updateFirstTitleEntrance()에서 자동 재생.
        // render()에서 매 프레임 opacity/transform을 덮어쓰면 자동 모션이
        // 스크롤 위치에 끌려가므로, 여기에서는 건드리지 않습니다.
    }

    // 06 ) 현재 오른쪽에 등장한 프로토타입 영상 하나만 재생합니다.
    const beforeServiceVideos = panels.slice(1).map((panel) => panel.querySelector("video"));
    // HOME / CARE LOG / ARCHIVE 순서. 필요하면 [1.2, 1.2, 1.2]처럼 배속 조정.
    const beforeServicePlaybackRates = [1, 1, 1];
    beforeServiceVideos.forEach((video, i) => {
        if (video) video.playbackRate = beforeServicePlaybackRates[i];
    });
    let activeBeforeServiceVideo = -1;

    function syncBeforeServiceVideos(p) {
        const rect = sequence.getBoundingClientRect();
        const inView = rect.bottom > 0 && rect.top < window.innerHeight &&
                       document.visibilityState !== "hidden";
        let next = -1;
        if (inView) {
            swipeStarts.forEach((start, i) => {
                if (p >= start + 0.006) next = i;
            });
        }
        if (next === activeBeforeServiceVideo) return;
        activeBeforeServiceVideo = next;
        beforeServiceVideos.forEach((video, i) => {
            if (!video) return;
            if (i === next) video.play().catch(() => {}); // 음소거 자동재생
            else video.pause();
        });
    }

    function renderMedia(p) {
        syncBeforeServiceVideos(p);
        const shrink = smooth(shrinkStart, shrinkEnd, p);
        stage.style.setProperty("--device_shrink", shrink.toFixed(4));
        stage.style.setProperty("--device_nfc_scale", lerp(1, 1.08, shrink).toFixed(4));

        panels.forEach((panel, i) => {
            if (i > 0) {
                // v9 smoothstep은 와이프 초/중/후 속도가 달랐음.
                // v10: 진행률에 비례해 거의 같은 간격으로 위로 밀려납니다.
                // 위 tick()의 미세한 지수 추종은 유지하므로 움직임이 딱딱하지 않음.
                const t = clamp((p - swipeStarts[i - 1]) / swipeLength);
                panel.style.clipPath = `inset(${((1 - t) * 100).toFixed(3)}% 0 0 0)`;
                panel.style.transform = "none";
            }
            const overlay = panel.querySelector(".device_service_media_overlay");
            if (overlay) {
                const amount = i === 3 ? 0 : overlayDarkness *
                    clamp((p - swipeStarts[i]) / swipeLength);
                overlay.style.opacity = amount.toFixed(3);
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

    function tick(now) {
        const dt = lastTime ? Math.min(0.048, (now - lastTime) / 1000) : 0.016;
        lastTime = now;

        // 지수 추종: 항상 '현재 보이는 위치 → 실제 스크롤 위치'로만 이동합니다.
        // 아래로 내렸으면 남은 만큼 위로 리빌하고, 위로 올렸으면 아래로 복귀합니다.
        // 목표를 넘지 않으므로 스크롤을 멈췄을 때 역방향으로 되튀지 않습니다.
        const remaining = targetProgress - visibleProgress;
        if (Math.abs(remaining) <= followEpsilon) {
            visibleProgress = targetProgress;
        } else {
            const follow = 1 - Math.exp(-dt / followSeconds);
            visibleProgress = clamp(visibleProgress + remaining * follow);
            // 부동소수점 오차·급격한 방향 전환에도 목표를 넘지 않도록 고정.
            if (remaining > 0) visibleProgress = Math.min(visibleProgress, targetProgress);
            else visibleProgress = Math.max(visibleProgress, targetProgress);
        }

        updateTriggers(visibleProgress); // 새 미디어 50% 도달 시점과 문구 전환 동기화
        render(visibleProgress);

        if (Math.abs(targetProgress - visibleProgress) > followEpsilon) {
            frameId = requestAnimationFrame(tick);
        } else {
            visibleProgress = targetProgress;
            updateTriggers(visibleProgress);
            render(visibleProgress);
            frameId = null;
            lastTime = 0;
        }
    }
    function requestRender() {
        targetProgress = getProgress();
        updateFirstTitleEntrance();
        if (frameId === null) frameId = requestAnimationFrame(tick);
    }

    let resizeTimer = null;
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(rebuildLines, 150);
        requestRender();
    });
    window.addEventListener("pageshow", requestRender);
    document.addEventListener("visibilitychange", requestRender);
    window.addEventListener("load", () => { rebuildLines(); requestRender(); });

    rebuildLines();
    if (document.fonts?.ready) document.fonts.ready.then(rebuildLines);
})();






// 06 ) 프로토타입 영상 재생 최적화
(() => {
    const sequence = document.querySelector(".device_service_sequence");

    if (!sequence) return;

    const panels = [
        ...sequence.querySelectorAll(
            ".device_service_media_phone[data-service-media]"
        )
    ];

    const videos = panels
        .map(panel => panel.querySelector("video"))
        .filter(Boolean);

    let ticking = false;

    // 패널이 아래에서 위로 얼마나 드러났는지 확인
    function getRevealProgress(panel) {
        const clipPath = getComputedStyle(panel).clipPath;

        // 예: inset(100% 0px 0px 0px)
        const match = clipPath.match(/inset\(\s*([\d.]+)(%|px)/);

        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2];

        const hiddenPercent = unit === "%"
            ? value
            : (value / panel.getBoundingClientRect().height) * 100;

        return 1 - Math.min(1, Math.max(0, hiddenPercent / 100));
    }

    function updateServiceVideos() {
        ticking = false;

        const rect = sequence.getBoundingClientRect();

        // 05~06 구간이 화면 밖이면 모든 영상 정지
        const isSequenceVisible =
            rect.bottom > 0 &&
            rect.top < window.innerHeight;

        let activeVideo = null;

        if (isSequenceVisible && !document.hidden) {

            // 뒤에 등장한 패널이 앞의 패널을 덮는 구조
            panels.forEach(panel => {
                const progress = getRevealProgress(panel);

                // 절반 이상 드러난 패널을 현재 영상으로 판단
                if (progress >= 0.5) {
                    activeVideo = panel.querySelector("video");
                }
            });
        }

        videos.forEach(video => {
            if (video === activeVideo) {

                // 현재 보이는 영상만 재생
                if (video.paused) {
                    video.play().catch(() => {});
                }

            } else {

                // 나머지는 일시정지
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    }

    // 스크롤 이벤트가 과도하게 실행되지 않도록 제한
    function requestVideoUpdate() {
        if (ticking) return;

        ticking = true;
        requestAnimationFrame(updateServiceVideos);
    }

    window.addEventListener("scroll", requestVideoUpdate, {
        passive: true
    });

    window.addEventListener("resize", requestVideoUpdate);

    document.addEventListener(
        "visibilitychange",
        requestVideoUpdate
    );

    window.addEventListener("pageshow", requestVideoUpdate);

    // 최초 상태 확인
    requestVideoUpdate();
})();






// 07 ) 스크롤에 따른 텍스트 opacity
(() => {
    const bridge = document.querySelector("#bridge");
    const copy = bridge?.querySelector(".bridge_copy");

    if (!bridge || !copy) return;

    // 스크롤 진행률 0~1
    const clamp = (value) => Math.max(0, Math.min(1, value));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        copy.style.opacity = "1";
        return;
    }

    let ticking = false;

    function updateBridgeCopy() {
        const rect = bridge.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // 그라디언트가 거의 끝난 뒤부터 카피가 나타남
        const start = viewportHeight * 0.15;
        const end = viewportHeight * 0.85;

        const progress = clamp(
            (-rect.top - start) / (end - start)
        );

        // 부드러운 opacity 변화
        const opacity = progress * progress * (3 - 2 * progress);

        copy.style.opacity = opacity.toFixed(3);

        ticking = false;
    }

    function requestBridgeUpdate() {
        if (ticking) return;

        ticking = true;
        requestAnimationFrame(updateBridgeCopy);
    }

    window.addEventListener("scroll", requestBridgeUpdate, { passive: true });
    window.addEventListener("resize", requestBridgeUpdate);
    window.addEventListener("pageshow", requestBridgeUpdate);

    updateBridgeCopy();
})();





// 10_application ) 상단 카피 스크롤 진입 모션
(() => {
    const application = document.querySelector("#application");
    const copy = application?.querySelector(".application_copy");
    if (!application || !copy) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !("IntersectionObserver" in window)) return;

    application.classList.add("is-motion-ready");

    const observer = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;

        copy.classList.add("is-visible");
        observer.disconnect(); // 한 번 등장한 뒤에는 유지
    }, {
        threshold: 0.35,
        rootMargin: "0px 0px -12% 0px"
    });

    observer.observe(copy);
})();





// 07_bridge ) 영상은 화면에 들어오면 재생, 반복 없이 끝 프레임에 정지
// - 기존 07 텍스트의 스크롤 연동 opacity와는 독립적으로 작동.
(() => {
    const video = document.querySelector("#bridge .bridge_media_video");
    if (!video) return;
    video.loop = false;
    video.muted = true;

    let inView = false;

    function syncBridgeVideo() {
        if (inView && document.visibilityState === "visible" && !video.ended) {
            video.play().catch((error) => {
                console.warn("[07_bridge] 영상 재생 실패:", video.currentSrc || video.src, error);
            });
        } else {
            video.pause();
        }
    }

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry) return;
            inView = entry.isIntersecting;
            syncBridgeVideo();
        }, { threshold: 0.25 });
        observer.observe(video);
    } else {
        inView = true;
        syncBridgeVideo();
    }

    document.addEventListener("visibilitychange", syncBridgeVideo);
})();


// 08_after-service ) 07→08 진입 시 04와 같은 상단 구도 리빌
// 스크롤을 내리면 이미지가 아래로 이동하며 윗부분이 드러나고,
// 올리면 반대로 가려집니다. 확대/축소, 04의 3단계 슬라이드 없음.
(() => {
    const intro = document.querySelector("#after-service .after-service_intro");
    if (!intro) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    let requestId = null;

    function updateEntry() {
        requestId = null;
        if (reducedMotion.matches) {
            intro.style.setProperty("--after_service_entry_pan", "0px");
            return;
        }

        const viewportHeight = Math.max(1, window.innerHeight);
        const introTop = intro.getBoundingClientRect().top;
        const progress = clamp((viewportHeight - introTop) / viewportHeight, 0, 1);
        // CSS의 추가 이미지 높이(min(23vh, 220px))와 같은 거리.
        const maxPan = Math.min(viewportHeight * 0.23, 220);
        const pan = -maxPan * (1 - progress);
        intro.style.setProperty("--after_service_entry_pan", `${pan.toFixed(2)}px`);
    }

    function requestEntryUpdate() {
        if (requestId !== null) return;
        requestId = requestAnimationFrame(updateEntry);
    }

    window.addEventListener("scroll", requestEntryUpdate, { passive: true });
    window.addEventListener("resize", requestEntryUpdate);
    window.addEventListener("pageshow", requestEntryUpdate);
    reducedMotion.addEventListener?.("change", requestEntryUpdate);
    updateEntry();
})();


// 06/08 ) 미디어 오류 진단: 실제 영상의 경로 / 인코딩 문제가 있으면 콘솔에 표시
// 표시·스크롤·재생 정책은 건드리지 않습니다.
(() => {
    const videos = document.querySelectorAll(
        "#before-service video, #after-service video"
    );
    videos.forEach((video) => {
        const warn = () => {
            const error = video.error;
            console.error("[영상 파일 오류]", {
                src: video.currentSrc || video.src,
                code: error?.code ?? null,
                message: error?.message || "리소스/코덱/파일 경로를 확인하세요",
                readyState: video.readyState,
                networkState: video.networkState
            });
        };
        video.addEventListener("error", warn);
        if (video.error) warn();
    });
})();





// 08 ) transition 스크롤 제어
(() => {

    const transition = document.querySelector(
        ".after-service_transition"
    );

    if (!transition) return;

    // 이미지 윗부분이 잘리는 최대 거리
    const maxPan = 200;

    let ticking = false;

    const clamp = (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    };

    function updateTransitionReveal() {

        const rect = transition.getBoundingClientRect();

        const viewportHeight = window.innerHeight;

        // 이미지가 뷰포트에 들어오는 동안 진행
        const revealDistance = Math.min(
            rect.height,
            viewportHeight
        );

        const progress = clamp(
            (viewportHeight - rect.top) / revealDistance,
            0,
            1
        );

        // -60px → 0px
        const pan = -maxPan * (1 - progress);

        transition.style.setProperty(
            "--transition-pan",
            `${pan.toFixed(2)}px`
        );

        ticking = false;
    }

    function requestTransitionUpdate() {

        if (ticking) return;

        ticking = true;

        requestAnimationFrame(updateTransitionReveal);
    }

    window.addEventListener(
        "scroll",
        requestTransitionUpdate,
        { passive: true }
    );

    window.addEventListener(
        "resize",
        requestTransitionUpdate
    );

    // 새로고침했을 때 현재 스크롤 위치 반영
    updateTransitionReveal();

})();





// 08_after-service ) 앱 프로토타입 재생 제어
// HOME: 영역이 화면에 있으면 루프 / Epilogue: 화면 중앙에 가장 가까운 폰 하나만 재생
(() => {
    const section = document.querySelector("#after-service");
    if (!section) return;

    const homeVideo = section.querySelector(".after-service_home_main video");
    const phones = [...section.querySelectorAll(".after-service_epilogue_phone")];
    const phoneVideos = phones.map((phone) => phone.querySelector("video"));
    let activePhone = -1;
    let requestedFrame = null;

    // 사별 후 HOME: 화면 밖에서 자원을 소비하지 않도록 재생을 멈춤.
    if (homeVideo && "IntersectionObserver" in window) {
        const homeObserver = new IntersectionObserver(([entry]) => {
            if (!entry) return;
            if (entry.isIntersecting && document.visibilityState === "visible") {
                homeVideo.play().catch(() => {});
            } else {
                homeVideo.pause();
            }
        }, { threshold: 0.25 });
        homeObserver.observe(homeVideo);
    }

    function updateEpilogueFocus() {
        requestedFrame = null;
        if (!phones.length) return;

        // 트랙패드 스크롤 중에도 매번 play()/pause()를 호출하지 않도록 포커스만 비교.
        const viewportHeight = window.innerHeight;
        const focusLine = viewportHeight * 0.5;
        let next = -1;
        let bestScore = Infinity;

        if (document.visibilityState === "visible") {
            phones.forEach((phone, i) => {
                if (!phoneVideos[i]) return;
                const rect = phone.getBoundingClientRect();
                const visibleHeight = Math.max(0,
                    Math.min(viewportHeight, rect.bottom) - Math.max(0, rect.top));
                const visibleRatio = visibleHeight / Math.max(1, rect.height);
                if (visibleRatio < 0.28) return;

                const center = rect.top + rect.height / 2;
                const score = Math.abs(center - focusLine) / viewportHeight - visibleRatio * 0.12;
                if (score < bestScore) {
                    bestScore = score;
                    next = i;
                }
            });
        }
        if (next === activePhone) return;
        activePhone = next;
        phoneVideos.forEach((video, i) => {
            if (!video) return;
            if (i === next && !video.ended) video.play().catch(() => {});
            else video.pause();
        });
    }

    function scheduleFocus() {
        if (requestedFrame !== null) return;
        requestedFrame = requestAnimationFrame(updateEpilogueFocus);
    }

    window.addEventListener("scroll", scheduleFocus, { passive: true });
    window.addEventListener("resize", scheduleFocus);
    window.addEventListener("pageshow", scheduleFocus);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            homeVideo?.pause();
            phoneVideos.forEach((video) => video?.pause());
            activePhone = -1;
        } else {
            if (homeVideo) {
                const rect = homeVideo.getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    homeVideo.play().catch(() => {});
                }
            }
        }
        scheduleFocus();
    });
    updateEpilogueFocus();
})();
