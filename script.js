// COMPONENT: OPEN OVERLAY
AFRAME.registerComponent('info-popup', {
  schema: { target: {type: 'string'} },
  init: function () {
    // When the AR Plane is clicked...
    this.el.addEventListener('click', () => {
      console.log("Plane Clicked! Opening: " + this.data.target);
      const overlay = document.getElementById(this.data.target);
      overlay.classList.add('visible');
    });
  }
});

// COMPONENT: TAP TO SWITCH MODELS
AFRAME.registerComponent('click-swapper', {
  init: function () {
    console.log("Click Swapper Loaded");
    this.defaultModel = this.el.querySelector('.model-default');
    this.waveModel = this.el.querySelector('.model-wave');
    this.isWaving = false;

    this.el.addEventListener('click', (evt) => {
      console.log("CLICK DETECTED!");
      if (this.isWaving) {
        this.defaultModel.setAttribute('visible', true);
        this.waveModel.setAttribute('visible', false);
        this.isWaving = false;
      } else {
        this.defaultModel.setAttribute('visible', false);
        this.waveModel.setAttribute('visible', true);
        this.isWaving = true;
      }
    });
  }
});

AFRAME.registerComponent('midpoint-handler', {
init: function () {
  this.target1 = document.querySelector('#personTarget');
  this.target2 = document.querySelector('#stationTarget');
  
  // Vectors for position and scale
  this.p1 = new THREE.Vector3();
  this.p2 = new THREE.Vector3();
  this.mid = new THREE.Vector3();
  this.s1 = new THREE.Vector3();

  // For rotation
  this.q1 = new THREE.Quaternion();
  this.q2 = new THREE.Quaternion();
},

tock: function () {
  if (!this.el.object3D.visible) return;

  // 1. FORCE UPDATE
  this.target1.object3D.updateMatrixWorld();
  this.target2.object3D.updateMatrixWorld();

  // 2. GET POSITIONS
  this.target1.object3D.getWorldPosition(this.p1);
  this.target2.object3D.getWorldPosition(this.p2);

  // 3. CALCULATE MIDPOINT
  this.mid.addVectors(this.p1, this.p2).multiplyScalar(0.5);

  // 4. SYNC SCALE
  this.target1.object3D.getWorldScale(this.s1);
  this.el.object3D.scale.copy(this.s1);

  // 5. APPLY POSITION
  this.el.object3D.position.copy(this.mid);

  // 6. ROTATION (Average the two cards)
  // Get rotation of Card 1
  this.target1.object3D.getWorldQuaternion(this.q1);
  // Get rotation of Card 2
  this.target2.object3D.getWorldQuaternion(this.q2);
  
  // "Slerp" (Spherical Blend) them 50% to find the exact middle angle
  this.el.object3D.quaternion.slerpQuaternions(this.q1, this.q2, 0.5);
}
});

function closeOverlay(id) {
    document.getElementById(id).classList.remove('visible');
}

// UI LOGIC
function startExperience() {
  // Fade out the big overlay
  const overlay = document.getElementById('overlay-screen');
  overlay.classList.add('hidden');

  // Slide in BOTH UI elements
  document.getElementById('status-pill').classList.add('slide-in-center');
  document.getElementById('info-button').classList.add('slide-in-corner');
}

function openInstructions() {
  // Bring back the big overlay
  document.getElementById('overlay-screen').classList.remove('hidden');

  // Slide both UI elements back up to hide
  document.getElementById('status-pill').classList.remove('slide-in-center');
  document.getElementById('info-button').classList.remove('slide-in-corner');
}

// AR LOGIC
document.addEventListener("DOMContentLoaded", function() {
  const personTarget = document.querySelector('#personTarget');
  const stationTarget = document.querySelector('#stationTarget');

  const modelPerson = document.querySelector('#modelPerson');
  const modelStation = document.querySelector('#modelStation');
  const mergedModel = document.querySelector('#mergedModel');

  const statusEl = document.querySelector('#status');
  const subtitleEl = document.querySelector('#status-subtitle');

  const planePerson = document.querySelector('#planePerson');
  const planeStation = document.querySelector('#planeStation');
  const planeMerged = document.querySelector('#planeMerged');

  const rodneyBtn = document.querySelector('#rodney-btn');
  const stationBtn = document.querySelector('#station-btn');

  let personVisible = false;
  let stationVisible = false;

  function togglePlane(plane, isVisible) {
    if (!plane) return;
    plane.setAttribute('visible', isVisible);
    if (isVisible) {
        plane.classList.add('clickable');
    } else {
        plane.classList.remove('clickable');
    }
  }

  function updateGameLogic() {
    if(subtitleEl) subtitleEl.style.display = 'none';
    if(rodneyBtn) rodneyBtn.style.display = 'none';
    if(stationBtn) stationBtn.style.display = 'none';

    if (personVisible && stationVisible) {
      // MERGED STATE
      modelPerson.setAttribute('visible', false);
      modelStation.setAttribute('visible', false);

      togglePlane(planePerson, false);
      togglePlane(planeStation, false);
    
      // Show the merged model based on midpoint handler
      mergedModel.setAttribute('visible', true);
      togglePlane(planeMerged, true);

      statusEl.textContent = "Both cards detected!";
      statusEl.style.color = "#75d15a";
      subtitleEl.style.display = 'block';
    } else {
      // SEPARATE STATE
      mergedModel.setAttribute('visible', false);
      togglePlane(planeMerged, false);

      if (personVisible) {
        modelPerson.setAttribute('visible', true);
        togglePlane(planePerson, true);

        rodneyBtn.style.display = 'flex';

        statusEl.textContent = "Worker card detected."
        statusEl.style.color = "#FFF";
        subtitleEl.style.display = 'block';
      }
      if (stationVisible) {
        modelStation.setAttribute('visible', true);
        togglePlane(planeStation, true);

        stationBtn.style.display = 'flex';
        
        statusEl.textContent = "Station card detected."
        statusEl.style.color = "#FFF";
        subtitleEl.style.display = 'block';
      }

      if (!stationVisible && !personVisible) {
        statusEl.textContent = "Scanning..."
        statusEl.style.color = "#FFD700";
      }
    }
  }

  // Event Listeners
  personTarget.addEventListener('targetFound', () => { personVisible = true; updateGameLogic(); });
  personTarget.addEventListener('targetLost', () => { personVisible = false; updateGameLogic(); });
  stationTarget.addEventListener('targetFound', () => { stationVisible = true; updateGameLogic(); });
  stationTarget.addEventListener('targetLost', () => { stationVisible = false; updateGameLogic(); });
});