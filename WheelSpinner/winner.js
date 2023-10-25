
const params = new URLSearchParams(window.location.search);
const winnerP = Array.from(document.getElementsByClassName("winner")).filter(node => node.nodeName.toLowerCase() == "p")[0];
const winnerDiv = Array.from(document.getElementsByClassName("winner")).filter(node => node.nodeName.toLowerCase() == "div")[0];
winnerP.textContent = params.get("winner") || params.get("name") || "Username";


document.addEventListener("DOMContentLoaded", function() {
    resize_to_fit();
    launchConfetti();
}); 


function resize_to_fit() {
    let fontsize = window.getComputedStyle(winnerP, null).getPropertyValue('font-size');
    winnerP.style['font-size'] = (parseFloat(fontsize) - 1) + "px";

    if (winnerP.scrollWidth > winnerP.clientWidth) {
        resize_to_fit();
    }
}



//confetti:
// do this for 5 seconds
var duration = 5000;
var end = Date.now() + duration;

function launchConfetti() {
	// launch a few confetti from the left edge
	confetti({
		particleCount: 7,
		angle: 60,
		spread: 55,
		origin: { x: 0 }
	});
	// and launch a few from the right edge
	confetti({
		particleCount: 7,
		angle: 120,
		spread: 55,
		origin: { x: 1 }
	});

	// launch more confetti until we are out of time
	if (Date.now() < end) {
		requestAnimationFrame(launchConfetti);
	}
};