const container = document.getElementById("pong-container");
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const width = container.offsetWidth-100-20;
const height = container.offsetHeight-100-20;
ctx.canvas.width = width;
ctx.canvas.height = height;
const max_fps = 120;

const black_color = window.getComputedStyle(document.documentElement).getPropertyValue('--black-color');
const white_color = window.getComputedStyle(document.documentElement).getPropertyValue('--white-color');
const gold_color = window.getComputedStyle(document.documentElement).getPropertyValue('--gold-color');

let muted = false;
const tap_audio = 'audio/tap.wav';
const gameover_audio = new Audio('audio/gameover.wav');
gameover_audio.volume = 0.65;
gameover_audio.playbackRate = 1.25;
gameover_audio.addEventListener('ended', () => {
  playing_gameover_sound = false;
});

let score = 0;

const paddle_size = new Array(15, 150);
const paddle_speed = 10;

const idle_paddle_speed = 12;
const idle_ball_speed = 15;

let left_paddle_pos = new Array(15, (height/2)-(paddle_size[1]/2));
let right_paddle_pos = new Array(width-15-paddle_size[0], (height/2)-(paddle_size[1]/2));

const ball_size = new Array(10, 10);
const initial_ball_speed = 3;
const ball_speed_increment = 0.3;

const randomness = 15;
const vertical_trajectory_block = 35;
const horizontal_trajectory_block = 20;
const initial_trajectory = horizontal_trajectory_block;

let ball_pos = new Array((width/2)-(ball_size[0]/2), (height/2)-(ball_size[1]/2));
let ball_trajectory = (Math.random()-0.5)*2*60;

const date = new Date();

let keypress = new Array(0, 0, 0, 0);
let touch_side = -1;
let touch_paddle = 0;

let playing_gameover_sound = false;
function playSound(path, idle) {
  if (!playing_gameover_sound && !muted) {
    const audio = new Audio(path);
    audio.onloadeddata = function() {
      if (idle) {
        audio.volume = 0.3;
      } else {
        audio.volume = 0.8;
      }
      audio.play();
    };
  }
}

document.addEventListener("keydown", event => {
  if (event.key === "m") {
    if (muted === false){
      muted = true;
      gameover_audio.muted = true;
    } else {
      muted = false;
      gameover_audio.muted = false;
    }
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    keypress[0] = 1;
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    keypress[1] = 1;
  }

  if (event.key === "w") {
    keypress[2] = 1;
  } else if (event.key === "s") {
    keypress[3] = 1;
  }
});
document.addEventListener("keyup", event => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    keypress[0] = 0;
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    keypress[1] = 0;
  }

  if (event.key === "w") {
    keypress[2] = 0;
  } else if (event.key === "s") {
    keypress[3] = 0;
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTrajectory(trajectory) {
  let new_trajectory = 0;
  let sin_new_traj = 0;
  let cos_new_traj = 0;
  let sin_traj = 0;
  let cos_traj = 0;
  while (true) {
    new_trajectory = trajectory+(Math.random()-0.5)*randomness;
    sin_new_traj = Math.sin(new_trajectory*(Math.PI / 180));
    cos_new_traj = Math.cos(new_trajectory*(Math.PI / 180));
    sin_traj = Math.sin(trajectory*(Math.PI / 180));
    cos_traj = Math.cos(trajectory*(Math.PI / 180));

    if ((((cos_traj > 0 && cos_new_traj > 0) ||
        (cos_traj < 0 && cos_new_traj < 0)) &&
        ((sin_traj > 0 && sin_new_traj > 0) ||
        (sin_traj < 0 && sin_new_traj < 0))) &&
        (!(sin_new_traj >= Math.sin((90-vertical_trajectory_block)*(Math.PI / 180))) &&
        !(sin_new_traj <= -Math.sin((90-vertical_trajectory_block)*(Math.PI / 180))) &&
        !(cos_new_traj >= Math.cos(horizontal_trajectory_block*(Math.PI / 180))) &&
        !(cos_new_traj <= -Math.cos(horizontal_trajectory_block*(Math.PI / 180))))) {

      return new_trajectory;
    }
  }
}

function movePaddle(paddle_name, pixels) {
  if (paddle_name === 'right') {
    if (pixels < 0) {
      if (right_paddle_pos[1] > 5) {
        right_paddle_pos[1] += Math.max(pixels, -(right_paddle_pos[1]-5));
      }
    } else {
      if (right_paddle_pos[1] < height-paddle_size[1]-5) {
        right_paddle_pos[1] += Math.min(pixels, (height-paddle_size[1]-5)-right_paddle_pos[1])
      }
    }
  } else if (paddle_name === 'left') {
    if (pixels < 0) {
      if (left_paddle_pos[1] > 5) {
        left_paddle_pos[1] += Math.max(pixels, -(left_paddle_pos[1]-5));
      }
    } else {
      if (left_paddle_pos[1] < height-paddle_size[1]-5) {
        left_paddle_pos[1] += Math.min(pixels, (height-paddle_size[1]-5)-left_paddle_pos[1])
      }
    }
  }
}

let done = false;
async function gameLoop() {
  done = false;
  ball_pos = new Array((width/2)-(ball_size[0]/2), (height/2)-(ball_size[1]/2));
  ball_trajectory = initial_trajectory;
  touch_paddle = 0;
  touch_side = -1;
  left_paddle_pos[1] = (height/2)-(paddle_size[1]/2);
  right_paddle_pos[1] = (height/2)-(paddle_size[1]/2);
  let ball_speed = initial_ball_speed;
  score = 0;
  while (!done) {

    let time = date.getTime();

    if (keypress[0] === 1) {
      movePaddle('right', -paddle_speed);
    } else if (keypress[1] === 1) {
      movePaddle('right', paddle_speed);
    } 
    if (keypress[2] === 1) {
      movePaddle('left', -paddle_speed);
    } else if (keypress[3] === 1) {
      movePaddle('left', paddle_speed);
    }

    if (ball_pos[0]+ball_size[0] > right_paddle_pos[0] && ball_pos[0] < right_paddle_pos[0]+paddle_size[0] && // ballRight more than paddleLeft && ballLeft less than paddleRight
      ball_pos[1] < right_paddle_pos[1]+paddle_size[1] && ball_pos[1]+ball_size[1] > right_paddle_pos[1] // ballTop less than paddleBot && ballBot more than paddleTop
      && touch_paddle === 0) {

      playSound(tap_audio, false);
      ball_trajectory = getTrajectory(180-ball_trajectory);
      ball_speed+=ball_speed_increment;
      score+=1;
      touch_paddle = 1;

    } else if (ball_pos[0] < left_paddle_pos[0]+paddle_size[0] && ball_pos[0] > left_paddle_pos[0] && // ballLeft less than paddleRight && ballLeft more than paddleLeft
      ball_pos[1] < left_paddle_pos[1]+paddle_size[1] && ball_pos[1]+ball_size[1] > left_paddle_pos[1] // ballTop less than paddleBot && ballBot more than paddleTop
      && touch_paddle === 1) {

      playSound(tap_audio, false);
      ball_trajectory = getTrajectory(180-ball_trajectory);
      ball_speed+=ball_speed_increment;
      score+=1;
      touch_paddle = 0;

    } else if (ball_pos[1] < 0) {    // ball hits roof

      if (touch_side === 1 || touch_side === -1) {
        playSound(tap_audio, false);
        ball_trajectory = -ball_trajectory;
        touch_side = 0
      }

    } else if (ball_pos[1]+ball_size[1] > height) {  // ball hits floor

      if (touch_side === 0 || touch_side === -1) {
        playSound(tap_audio, false);
        ball_trajectory = -ball_trajectory;
        touch_side = 1
      }

    } else if (ball_pos[0]+ball_size[0] > width || ball_pos[0] <  0) {  // ballRight more than width || BallLeft less than 0

      if (!muted){
        playing_gameover_sound = true;
        gameover_audio.play()
      }
      gameOver();

    }

    ball_pos[0] += ball_speed * Math.cos(ball_trajectory*(Math.PI / 180));
    ball_pos[1] -= ball_speed * Math.sin(ball_trajectory*(Math.PI / 180));
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = black_color;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = white_color;

    ctx.fillRect(left_paddle_pos[0], left_paddle_pos[1], paddle_size[0], paddle_size[1]);
    ctx.fillRect(right_paddle_pos[0], right_paddle_pos[1], paddle_size[0], paddle_size[1]);

    ctx.fillRect(ball_pos[0], ball_pos[1], ball_size[0], ball_size[1]);

    ctx.font = "56px arcade";
    ctx.textAlign = 'center';
    ctx.fillText(score, width/2, 100);

    let time_to_sleep = (-(((date.getTime()-time)/(max_fps))-(1/(max_fps))))*1000;
    if (time_to_sleep > 0) {
      await sleep((-(((date.getTime()-time)/(max_fps))-(1/(max_fps))))*1000);
    }
  }
}

let idle_done = false;
async function idleGameLoop() {
  idle_done = false;
  ball_pos = new Array((width/2)-(ball_size[0]/2), (height/2)-(ball_size[1]/2));
  ball_trajectory = initial_trajectory;
  touch_paddle = 0;
  touch_side = -1;
  while (!idle_done) {

    let time = date.getTime();

    if (ball_pos[0]+ball_size[0] > right_paddle_pos[0] && ball_pos[0] < right_paddle_pos[0]+paddle_size[0] && // ballRight more than paddleLeft && ballLeft less than paddleRight
      ball_pos[1] < right_paddle_pos[1]+paddle_size[1] && ball_pos[1]+ball_size[1] > right_paddle_pos[1] // ballTop less than paddleBot && ballBot more than paddleTop
      && touch_paddle === 0) {

      playSound(tap_audio, true);
      ball_trajectory = getTrajectory(180-ball_trajectory);
      touch_paddle = 1;

    } else if (ball_pos[0] < left_paddle_pos[0]+paddle_size[0] && ball_pos[0] > left_paddle_pos[0] && // ballLeft less than paddleRight && ballLeft more than paddleLeft
      ball_pos[1] < left_paddle_pos[1]+paddle_size[1] && ball_pos[1]+ball_size[1] > left_paddle_pos[1] // ballTop less than paddleBot && ballBot more than paddleTop
      && touch_paddle === 1) {

      playSound(tap_audio, true);
      ball_trajectory = getTrajectory(180-ball_trajectory);
      touch_paddle = 0;

    } else if (ball_pos[1] < 0) {    // ball hits roof

      if (touch_side === 1 || touch_side === -1) {
        playSound(tap_audio, true);
        ball_trajectory = -ball_trajectory;
        touch_side = 0
      }

    } else if (ball_pos[1]+ball_size[1] > height) {  // ball hits floor

      if (touch_side === 0 || touch_side === -1) {
        playSound(tap_audio, true);
        ball_trajectory = -ball_trajectory;
        touch_side = 1
      }

    }
    if (ball_pos[0]+ball_size[0] > width || ball_pos[0] <  0) {  // ballRight more than width || BallLeft less than 0
      ball_pos = new Array((width/2)-(ball_size[0]/2), (height/2)-(ball_size[1]/2));
      ball_trajectory = initial_trajectory;
      touch_paddle = 0;
      touch_side = -1;
    }

    ball_pos[0] += idle_ball_speed * Math.cos(ball_trajectory*(Math.PI / 180));
    ball_pos[1] -= idle_ball_speed * Math.sin(ball_trajectory*(Math.PI / 180));
    
    if (touch_paddle === 1) {
      if (left_paddle_pos[1]+paddle_size[1]/2 < ball_pos[1]) {
        movePaddle('left', Math.min(idle_paddle_speed, ball_pos[1]-(left_paddle_pos[1]+paddle_size[1]/2)));
      } else {
        movePaddle('left', Math.max(-idle_paddle_speed, ball_pos[1]-(left_paddle_pos[1]+paddle_size[1]/2)));
      }
    } else {
      if (right_paddle_pos[1]+paddle_size[1]/2 < ball_pos[1]) {
        movePaddle('right', Math.min(idle_paddle_speed, ball_pos[1]-(right_paddle_pos[1]+paddle_size[1]/2)));
      } else {
        movePaddle('right', Math.max(-idle_paddle_speed, ball_pos[1]-(right_paddle_pos[1]+paddle_size[1]/2)));
      }
    }
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = black_color;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = white_color;

    ctx.fillRect(left_paddle_pos[0], left_paddle_pos[1], paddle_size[0], paddle_size[1]);
    ctx.fillRect(right_paddle_pos[0], right_paddle_pos[1], paddle_size[0], paddle_size[1]);

    ctx.fillRect(ball_pos[0], ball_pos[1], ball_size[0], ball_size[1]);

    let time_to_sleep = (-(((date.getTime()-time)/(max_fps))-(1/(max_fps))))*1000;
    if (time_to_sleep > 0) {
      await sleep((-(((date.getTime()-time)/(max_fps))-(1/(max_fps))))*1000);
    }
  }
}

function gameOver() {
  done = true;
  idleGameLoop();
  const panel = document.createElement("div");
  panel.id = "panel";
  const score_header = document.createElement("h1");
  score_header.id = "score";
  score_header.innerHTML = "Score";
  const score_num = document.createElement("h1");
  score_num.id = "score_num";
  score_num.innerHTML = score;
  if (score >= 50) { score_num.style.color = gold_color } else { score_num.style.color = white_color }
  const start_button = document.createElement("div");
  start_button.id = "retry-button";
  start_button.innerHTML = "PLAY";
  start_button.addEventListener("click", () => {
    idle_done = true;
    gameLoop();
    panel.remove();
  });
  panel.appendChild(score_header);
  panel.appendChild(score_num);
  panel.appendChild(start_button);
  container.appendChild(panel);
}

const start_button = document.createElement("div");
start_button.id = "start-button";
start_button.innerHTML = "PLAY";
start_button.addEventListener("click", () => {
  idle_done = true;
  gameLoop();
  start_button.remove();
});
container.appendChild(start_button);
idleGameLoop();