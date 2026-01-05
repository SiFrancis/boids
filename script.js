const canvas = document.getElementById('boids_canvas');
const ctx = canvas.getContext("2d");
const heightRatio = 9/16;
canvas.height = canvas.width * heightRatio;

// run/pause button functionality
let running = false;
function run_toggle() {
  let control_btn = document.getElementById("control_btn");
  if (control_btn.value == "Paused") {
    control_btn.value = "Running";
    running = true;
    control_btn.innerHTML = "Pause";
  } else if (control_btn.value == "Running") {
    control_btn.value = "Paused";
    running = false;
    control_btn.innerHTML = "&nbsp;&nbsp;Run&nbsp;&nbsp;";
  }
}

// utility function for random positions
// random integer from a range INCLUDING min and max
function rand_int(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const boids_num = 50;
const boids_size = 7;

const spawn_margin_percent = 0.1;
const x_min = canvas.width*spawn_margin_percent;
const x_max = canvas.width*(1 - spawn_margin_percent);
const y_min = canvas.height*spawn_margin_percent;
const y_max = canvas.height*(1 - spawn_margin_percent);

const min_vel = 15;
const max_vel = 20;

// slider values
let coherence_slider = document.getElementById("coherence_slider");
let separation_slider = document.getElementById("separation_slider");
let alignment_slider = document.getElementById("alignment_slider");

// boids values
let coherence_factor = coherence_slider.value;
// let separation_distance = separation_slider.value;
let separation_distance = 40;
let separation_factor = 5;
let alignment_factor = alignment_slider.value;

//hidden tunable values
let turn_factor = 50;

// utility function - map slider values to a certain range
// from https://douiri.org/blog/range-mapping/
function rangemap(value, sourceStart, sourceEnd, targetStart, targetEnd) {
    return (value - sourceStart) / (sourceEnd - sourceStart) * (targetEnd - targetStart) + targetStart
}

// update values
coherence_slider.oninput = () => {coherence_factor = coherence_slider.value;}
separation_slider.oninput = () => {
  separation_distance = separation_slider.value;
  separation_factor *= rangemap(separation_slider.value, separation_slider.min, separation_slider.max, 0.001, 0.5);
}
alignment_slider.oninput = () => {alignment_factor = alignment_slider.value;}

// because why not
class Vec2D {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
}

// boids logic, including these helper functions, are derived from
// http://www.kfish.org/boids/pseudocode.html
// apologies for shitty code this is my first js project lol
function vec_add(...vecs) {
  v = new Vec2D();
  for (let vec of vecs) {
    v.x += vec.x;
    v.y += vec.y;
  }
  return v;
}

function vec_subtract(v1, v2) {
  return new Vec2D(v1.x - v2.x, v1.y - v2.y);
}

function vec_mult_scalar(v1, n) {
  return new Vec2D(v1.x * n, v1.y * n);
}

function vec_div_scalar(v1, n) {
  return new Vec2D(v1.x / n, v1.y / n);
}

function vec_distance(v1, v2) {
  return Math.sqrt((v2.x - v1.x)**2 + (v2.y - v1.y)**2);
}

class Boid {
    constructor(x, y, vx, vy) {
        this.position = new Vec2D(x, y);
        this.velocity = new Vec2D(vx, vy);
    }
}

let boids_arr = [];

function create_boids() {
  for (let i = 0; i <= boids_num; i++) {
    let spawn_x = rand_int(x_min, x_max);
    let spawn_y = rand_int(y_min, y_max);
  
    b = new Boid(spawn_x, spawn_y, 0, 0);
    boids_arr.push(b);
  }
}

function limit_velocity(boid) {
  let v_magnitude = vec_distance(boid.velocity, new Vec2D());
  if (v_magnitude < min_vel) {
    boid.velocity = vec_mult_scalar(vec_div_scalar(boid.velocity, v_magnitude), min_vel);
  }
  if (v_magnitude > max_vel) {
    boid.velocity = vec_mult_scalar(vec_div_scalar(boid.velocity, v_magnitude), max_vel);
  }
}

function move_boids() {
  boids_arr.forEach((boid) => {
    let v1 = rule1(boid);
    let v2 = rule2(boid);
    let v3 = rule3(boid);
    let v4 = rule4(boid);

    boid.velocity = vec_add(boid.velocity, v1, v2, v3, v4);
    limit_velocity(boid);
    boid.position = vec_add(boid.position, boid.velocity);
  });
}

function rule1(boid) {  
  let perceived_center = new Vec2D();
  const other_boids = boids_arr.filter((b) => b !== boid);
  other_boids.forEach((other_boid) => {
    perceived_center = vec_add(perceived_center, other_boid.position)
  });
  perceived_center = vec_div_scalar(perceived_center, boids_num - 1);
  
  return vec_mult_scalar(vec_subtract(perceived_center, boid.position), coherence_factor);
}

function rule2(boid) {
  let c = new Vec2D();
  
  const other_boids = boids_arr.filter((b) => b !== boid);
  other_boids.forEach((other_boid) => {
    if (vec_distance(other_boid.position, boid.position) < separation_distance) {
     c = vec_subtract(c, vec_subtract(other_boid.position, boid.position)) 
    }
  });
  
  return vec_mult_scalar(c, separation_factor);
}

function rule3(boid) {
  let perceived_velocity = new Vec2D();
  const other_boids = boids_arr.filter((b) => b !== boid);
  other_boids.forEach((other_boid) => {
    perceived_velocity = vec_add(perceived_velocity, other_boid.velocity)
  });

  perceived_velocity = vec_div_scalar(perceived_velocity,  boids_num - 1);

  return vec_mult_scalar(vec_subtract(perceived_velocity, boid.velocity), alignment_factor)
}

function rule4(boid) {
  v = new Vec2D();
  if (boid.position.x < x_min) {
    v.x = turn_factor*max_vel;
  } else if (boid.position.x > x_max) {
    v.x = -turn_factor*max_vel;
  }

  if (boid.position.y < y_min) {
    v.y = turn_factor*max_vel;
  } else if (boid.position.y > y_max) {
    v.y = -turn_factor*max_vel;
  }
  
  return v;
}

function render() {
  boids_arr.forEach((boid) => {
    ctx.fillStyle = "dodgerblue";
    ctx.beginPath();
    ctx.arc(boid.position.x, boid.position.y, boids_size, 0, 2*Math.PI, true);
    ctx.fill();

    // ctx.strokeStyle = "rgb(0 0 0 / 20%)";
    // ctx.beginPath();
    // ctx.arc(boid.position.x, boid.position.y, separation_distance, 0, 2*Math.PI, true);
    // ctx.stroke();
    // console.log(`Drew a boid at (${boid.x}, ${boid.y})`);
  });
}

function init() { 
  create_boids();
  window.requestAnimationFrame(draw_loop);
}

function draw_loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (running) {move_boids()}
  render();
  window.requestAnimationFrame(draw_loop);
}

init();
