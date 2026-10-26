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

    // 06: 타이틀과 본문 각 행의 상승 시간은 650ms로 동일합니다.
    // 이미지/본문 순서가 뒤섞이지 않도록 마지막 행이 완료되는 시점을 반환합니다.
    function startServiceReveal(i, transitionId) {
        const card = descriptions[i];
        stopAnimation(card);
        card.style.opacity = "1";
        card.style.visibility = "visible";
        const korean = linesFor(card.querySelector(".before-service_description_ko"));
        const english = linesFor(card.querySelector(".before-service_description_en"));
        const riseDuration = 650;
        if (i > 0) playTitleRise(titles[i], riseDuration);
        korean.forEach((line, index) => playRise(line, 75 + index * 64, riseDuration));
        english.forEach((line, index) =>
            playRise(line, 125 + korean.length * 64 + index * 64, riseDuration));

        // 첫 한국어 행이 막 올라오기 시작할 때 깜식이 사진도 부드럽게 등장.
        // 텍스트보다 먼저 튀어나오지도, 마지막 행까지 기다리느라 늦지도 않습니다.
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

    function renderMedia(p) {
        const shrink = smooth(shrinkStart, shrinkEnd, p);
        stage.style.setProperty("--device_shrink", shrink.toFixed(4));
        stage.style.setProperty("--device_nfc_scale", lerp(1, 0.88, shrink).toFixed(4));

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
    window.addEventListener("load", () => { rebuildLines(); requestRender(); });

    rebuildLines();
    if (document.fonts?.ready) document.fonts.ready.then(rebuildLines);
})();




// 07 ) 텍스트 opacity 조정 모션
(() => {
    const bridge = document.querySelector("#bridge");
    const copy = bridge?.querySelector(".bridge_copy");
    if (!bridge || !copy) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !("IntersectionObserver" in window)) return;

    // 이미 카피가 충분히 화면 안으로 들어왔다면 바로 관측 시작.
    bridge.classList.add("is-motion-ready");

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            copy.classList.add("is-visible");
            observer.disconnect(); // 한번 차분하게 등장한 후에는 그대로 유지
            break;
        }
    }, {
        threshold: 0.2,
        rootMargin: "0px 0px -22% 0px"
    });

    observer.observe(copy);
})();
