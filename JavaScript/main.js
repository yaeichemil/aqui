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
    const deviceCopy = sequence.querySelector(".device_intro_copy");
    const marker = sequence.querySelector(".before-service_mark");
    const dog = sequence.querySelector(".before-service_dog");
    const titleCards = [...sequence.querySelectorAll("[data-service-title]")];
    const bodyCards = [...sequence.querySelectorAll("[data-service-description]")];
    const panels = [...sequence.querySelectorAll("[data-service-media]")];

    const koCards = bodyCards.map((card) => card.querySelector(".before-service_description_ko"));
    const enCards = bodyCards.map((card) => card.querySelector(".before-service_description_en"));

    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    const lerp = (from, to, progress) => from + (to - from) * progress;
    const range = (start, end, value) => clamp((value - start) / (end - start));
    const easeOut = (value) => 1 - Math.pow(1 - value, 4);
    const smooth = (start, end, value) => {
        const t = range(start, end, value);
        return t * t * (3 - 2 * t);
    };

    // 이미지 전환 시작 위치 (전체 스크롤 진행률 0~1 기준)
    const swipeStarts = [0.585, 0.720, 0.855];
    const swipeLength = 0.082; // 스크롤 길이가 조금 길어져 와이프가 덜 급합니다.

    // 레퍼런스처럼 '문장이 나타나기 전 마스크 안에서 올라오는' 효과.
    // 제목 / 한글 / 영문에 각각 다른 시작 시간을 주어 순서대로 등장합니다.
    function animateText(element, enterStart, enterEnd, exitStart, exitEnd, p, distance) {
        if (!element) return;

        const enter = easeOut(range(enterStart, enterEnd, p));
        const exit = exitStart === null ? 0 : smooth(exitStart, exitEnd, p);

        // 진입: 텍스트가 고정된 창 아래에서 올라오며 순차적으로 드러납니다.
        // 퇴장: 마스크는 열린 채 약간 올라가면서 자연스럽게 사라집니다.
        // 이미지와 달리 텍스트는 '상단부터 읽히는' 방향으로 리빌합니다.
        const opacity = enter * (1 - exit);
        const translateY = lerp(distance, 0, enter) - 8 * exit;
        const hiddenBottom = (1 - enter) * 100;

        element.style.opacity = opacity.toFixed(3);
        element.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
        element.style.clipPath = `inset(0 0 ${hiddenBottom.toFixed(2)}% 0)`;
        element.style.visibility = opacity < 0.001 ? "hidden" : "visible";
    }

    function animateServiceText(index, enterAt, exitAt, p) {
        // 퇴장은 다음 이미지가 약 50% 올라왔을 때 시작.
        const titleExitStart = exitAt === null ? null : exitAt + swipeLength * 0.50;
        const titleExitEnd = exitAt === null ? null : exitAt + swipeLength * 0.87;

        animateText(titleCards[index], enterAt, enterAt + 0.030,
            titleExitStart, titleExitEnd, p, 38);
        animateText(koCards[index], enterAt + 0.009, enterAt + 0.037,
            titleExitStart, titleExitEnd, p, 28);
        animateText(enCards[index], enterAt + 0.022, enterAt + 0.053,
            titleExitStart, titleExitEnd, p, 28);
    }

    // 매 프레임마다 실제 화면 상태 계산 (역방향 스크롤도 동일하게 동작).
    function render(p) {
        // 05 : 양쪽 카피 동시 등장 → 유지 → 사라짐
        const copyEnter = smooth(0.08, 0.145, p);
        const copyExit = 1 - smooth(0.23, 0.30, p);
        deviceCopy.style.opacity = (copyEnter * copyExit).toFixed(3);
        deviceCopy.style.transform = `translate3d(0, ${lerp(38, 0, copyEnter).toFixed(2)}px, 0)`;

        // 05→06 : 왼쪽 경계가 오른쪽으로 좁혀지며 정착
        const shrink = smooth(0.32, 0.425, p);
        stage.style.setProperty("--device_shrink", shrink.toFixed(4));
        stage.style.setProperty("--device_nfc_scale", lerp(1, 0.80, shrink).toFixed(4));

        // 06 : 네모와 깜식이는 처음 등장한 뒤 끝까지 유지.
        // 위로 다시 스크롤하면 자연스럽게 사라짐.
        const decorationsOpacity = smooth(0.425, 0.490, p).toFixed(3);
        marker.style.opacity = decorationsOpacity;
        dog.style.opacity = decorationsOpacity;

        // HTML에는 이미 한글/영문 p가 별개로 있습니다.
        // 본문 전체 박스를 움직이던 v1과 달리, 세 단위를 각각 조작합니다.
        bodyCards.forEach((card) => {
            card.style.opacity = "1";
            card.style.transform = "none";
            card.style.visibility = "visible";
        });

        // 최초 NFC : 오른쪽 미디어 정착 후 텍스트 등장
        animateServiceText(0, 0.438, swipeStarts[0], p);

        // HOME / CARE LOG / ARCHIVE : 새 이미지가 거의 정착하면 다음 타이틀 시작 (이전 문구와 겹치지 않음)
        for (let i = 1; i < 4; i++) {
            const enterAt = swipeStarts[i - 1] + swipeLength * 0.85;
            const exitAt = i === 3 ? null : swipeStarts[i];
            animateServiceText(i, enterAt, exitAt, p);
        }

        // 미디어 마스크 와이프 : 이미지 자체는 제자리에 고정합니다.
        // 새 패널의 보이는 범위만 아래 → 위로 열리므로 화면이 렌더되듯 드러납니다.
        // 0%일 때 전체 가림, 50%일 때 아래 절반만 보임, 100%일 때 완전히 보임.
        panels.forEach((panel, i) => {
            const shade = panel.querySelector(".device_service_media_overlay");
            if (i > 0) {
                const reveal = smooth(swipeStarts[i - 1], swipeStarts[i - 1] + swipeLength, p);
                const hiddenTop = (1 - reveal) * 100;
                panel.style.clipPath = `inset(${hiddenTop.toFixed(3)}% 0 0 0)`;
                // v1의 translateY(100%)를 덮어씁니다. 픽셀 이미지 자체는 이동하지 않아요.
                panel.style.transform = "none";
            }
            if (shade) {
                shade.style.opacity = i === 3 ? "0" :
                    (0.34 * smooth(swipeStarts[i], swipeStarts[i] + swipeLength, p)).toFixed(3);
            }
        });
    }

    // 트랙패드/마우스 휠로 스크롤이 점프해도 변화가 뚝뚝 끊기지 않도록
    // 실제 진행률을 약간 뒤따라가도록 하는 보간 처리 (약 110ms 반응).
    // 사용자 스크롤이 끝나면 애니메이션 루프도 멈춥니다.
    function getProgress() {
        const scrollDistance = Math.max(1, sequence.offsetHeight - window.innerHeight);
        return clamp(-sequence.getBoundingClientRect().top / scrollDistance);
    }

    let targetProgress = getProgress();
    let visibleProgress = targetProgress;
    let frameId = null;
    let lastTime = 0;

    function tick(time) {
        const delta = lastTime ? Math.min(80, time - lastTime) : 16;
        lastTime = time;
        const follow = 1 - Math.exp(-delta / 110);
        visibleProgress += (targetProgress - visibleProgress) * follow;
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

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender);
    window.addEventListener("load", requestRender);
    window.addEventListener("pageshow", requestRender);
    render(visibleProgress);
})();
