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