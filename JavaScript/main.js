console.log("Capstone Design web is running.");



// 탑 버튼
const topBtn = document.querySelector("#topBtn");

topBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
    });
});