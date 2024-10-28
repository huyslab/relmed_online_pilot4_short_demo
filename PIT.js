// Configuration PIT object
const PITconfig = {
  magnitudes: [1, 2, 5],
  ratios: [16, 8, 1],
  RPPs: [0.0625, 0.25, 5.0],
  coins: [1, 0.01, -1, -0.01],
  trialDuration: 7000 // in milliseconds on average, U[9500, 10500]
};

const PITtrialList = [{"magnitude":2,"ratio":8,"coin":-0.01,"trialDuration":6902},{"magnitude":5,"ratio":8,"coin":1,"trialDuration":7221},{"magnitude":2,"ratio":1,"coin":0.01,"trialDuration":7228},{"magnitude":1,"ratio":1,"coin":-1,"trialDuration":7044},{"magnitude":1,"ratio":8,"coin":0.5,"trialDuration":6506},{"magnitude":2,"ratio":16,"coin":-1,"trialDuration":6827},{"magnitude":1,"ratio":1,"coin":0.5,"trialDuration":6890},{"magnitude":2,"ratio":8,"coin":1,"trialDuration":7236},{"magnitude":2,"ratio":16,"coin":-0.5,"trialDuration":7465},{"magnitude":2,"ratio":16,"coin":-0.01,"trialDuration":7207},{"magnitude":2,"ratio":1,"coin":-0.5,"trialDuration":6535},{"magnitude":5,"ratio":8,"coin":0.5,"trialDuration":7376},{"magnitude":2,"ratio":1,"coin":-0.01,"trialDuration":6652},{"magnitude":1,"ratio":1,"coin":0.01,"trialDuration":7199},{"magnitude":1,"ratio":8,"coin":1,"trialDuration":7293},{"magnitude":1,"ratio":8,"coin":-0.5,"trialDuration":6870},{"magnitude":2,"ratio":8,"coin":-1,"trialDuration":6962},{"magnitude":2,"ratio":1,"coin":-1,"trialDuration":7490},{"magnitude":1,"ratio":8,"coin":0.01,"trialDuration":6688},{"magnitude":1,"ratio":1,"coin":1,"trialDuration":7145},{"magnitude":5,"ratio":8,"coin":0.01,"trialDuration":7261},{"magnitude":2,"ratio":8,"coin":0.01,"trialDuration":6891},{"magnitude":5,"ratio":8,"coin":-1,"trialDuration":7386},{"magnitude":2,"ratio":8,"coin":-0.5,"trialDuration":6888},{"magnitude":1,"ratio":1,"coin":-0.01,"trialDuration":6985},{"magnitude":5,"ratio":8,"coin":-0.5,"trialDuration":6956},{"magnitude":1,"ratio":8,"coin":-0.01,"trialDuration":6862},{"magnitude":1,"ratio":8,"coin":-1,"trialDuration":7182},{"magnitude":2,"ratio":16,"coin":0.5,"trialDuration":7452},{"magnitude":2,"ratio":1,"coin":0.5,"trialDuration":7009},{"magnitude":1,"ratio":1,"coin":-0.5,"trialDuration":6726},{"magnitude":2,"ratio":16,"coin":1,"trialDuration":6679},{"magnitude":5,"ratio":8,"coin":-0.01,"trialDuration":6666},{"magnitude":2,"ratio":16,"coin":0.01,"trialDuration":6954},{"magnitude":2,"ratio":8,"coin":0.5,"trialDuration":6501},{"magnitude":2,"ratio":1,"coin":1,"trialDuration":6825}].slice(0,5);

// Trial stimulus function
function generatePITstimulus(coin, ratio) {
  const ratio_index = experimentConfig.ratios.indexOf(ratio);
  // Calculate saturation based on ratio
  const ratio_factor = ratio_index / (experimentConfig.ratios.length - 1);
  const piggy_style = `filter: saturate(${50 * (400 / 50) ** ratio_factor}%);`;
  if (coin === 1) {
    piggyBgImg = 'imgs/marble1.png'
  } else if (coin === 0.5) {
    piggyBgImg = 'imgs/marble2.png'
  } else if (coin === 0.01) {
    piggyBgImg = 'imgs/marble3.png'
  } else if (coin === -1) {
    piggyBgImg = 'imgs/marble4.png'
  } else if (coin === -0.5) {
    piggyBgImg = 'imgs/marble5.png'
  } else if (coin === -0.01) {
    piggyBgImg = 'imgs/marble6.png'
  }
  return `
    <div class="experiment-wrapper" style="background-image: url(${piggyBgImg});background-repeat: repeat; background-size: 30vw;">
      <!-- Middle Row (Piggy Bank & Coins) -->
      <div id="experiment-container">
        <div id="bg-container">
          <img id="piggy-bg-1" src="imgs/piggy-cloud.png" alt="Piggy background" style="transform: translate(0vw, -4vh); position: absolute">
          <img id="piggy-bg-2" src="imgs/piggy-cloud.png" alt="Piggy background" style="transform: translate(0vw, -4vh); position: absolute">
        </div>
        <div id="piggy-container">
          <!-- Piggy Bank Image -->
          <img id="piggy-bank" src="imgs/piggy-bank.png" alt="Piggy Bank" style="${piggy_style}">
        </div>
        <div id="obstructor-container">
          <img id="obstructor" src="imgs/occluding_clouds.png" alt="Obstructor">
        </div>
      </div>
    </div>
  `;
}

// PIT trial
let PITtrialCounter = 0;
const PITtrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function () {
    return generatePITstimulus(jsPsych.evaluateTimelineVariable('coin'), jsPsych.evaluateTimelineVariable('ratio'));
  },
  choices: 'NO_KEYS',
  // response_ends_trial: false,
  trial_duration: jsPsych.timelineVariable('trialDuration'),
  save_timeline_variables: ["magnitude", "ratio"],
  data: {
    trialphase: 'pit_trial',
    pit_coin: jsPsych.timelineVariable('coin'),
    trial_duration: jsPsych.timelineVariable('trialDuration'),
    response_time: () => { return window.responseTime },
    trial_presses: () => { return window.trialPresses },
    trial_reward: () => { return window.trialReward },
    // Record global data
    total_presses: () => { return window.totalPresses },
    total_reward: () => { return window.totalReward }
  },
  on_start: function (trial) {
    if (window.prolificPID.includes("simulate")) {
      trial.trial_duration = 1000 / 60;
    }
    // Create a shared state object
    window.trialPresses = 0;
    window.trialReward = 0;
    window.responseTime = [];

    let lastPressTime = 0;
    let pressCount = 0;

    const ratio = jsPsych.evaluateTimelineVariable('ratio');
    const magnitude = jsPsych.evaluateTimelineVariable('magnitude');

    const keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: function (info) {
        window.responseTime.push(info.rt - lastPressTime);
        lastPressTime = info.rt;
        // wigglePiggy();
        shakePiggy();
        pressCount++;
        window.trialPresses++;
        window.totalPresses++;

        if (pressCount === ratio) {
          window.trialReward += magnitude;
          window.totalReward += magnitude;
          pressCount = 0;
        }
      },
      valid_responses: ['b'],
      rt_method: 'performance',
      persist: true,
      allow_held_key: false,
      minimum_valid_rt: 0
    });
  },
  on_load: function () {
    updatePiggyTails(jsPsych.evaluateTimelineVariable('magnitude'), jsPsych.evaluateTimelineVariable('ratio'));
  },
  on_finish: function (data) {
    // Clean up listener
    jsPsych.pluginAPI.cancelAllKeyboardResponses();
    PITtrialCounter += 1;
    data.pit_trial_number = PITtrialCounter;
    if (PITtrialCounter % (PITtrials.length / 3) == 0 || PITtrialCounter == PITtrials.length) {
      saveDataREDCap(retry = 3);
    }
  },
  simulation_options: {
    data: {
      trial_presses: () => { window.trialPresses = jsPsych.randomization.randomInt(8, 20) },
      trial_reward: () => { window.trialReward = Math.floor(window.trialPresses / jsPsych.evaluateTimelineVariable('ratio')) * jsPsych.evaluateTimelineVariable('magnitude') },
      response_time: () => {
        do {
          window.responseTime = [];
          for (let i = 0; i < window.trialPresses; i++) {
            window.responseTime.push(Math.floor(jsPsych.randomization.sampleExGaussian(150, 15, 0.01, true)));
          }
        } while (window.responseTime.reduce((acc, curr) => acc + curr, 0) > experimentConfig.trialDuration);
      },
      total_presses: () => { window.totalPresses += window.trialPresses },
      total_reward: () => { window.totalReward += window.trialReward }
    }
  }
};

// Create timeline for PIT task
const PITtrials = [];
PITtrialList.forEach(trial => {
  PITtrials.push({
    timeline: [kick_out, fullscreen_prompt, PITtrial],
    timeline_variables: [trial]
  });
});

function getSelectedPITtrial() {
  const raw_data = jsPsych.data.get().filterCustom((trial) => trial.trialphase == "pit_trial");
  const trial_rewards = raw_data.select('trial_reward').values;
  // Select a random trial to be the bonus round with weights based on the rewards
  const selected_trial = jsPsych.randomization.sampleWithReplacement(raw_data.values(), 1, trial_rewards.map(reward => logNormalPDF(reward, Math.log(40), 0.3)));
  // Side effect: Save the reward for the bonus round
  window.sampledPITreward = selected_trial[0].trial_reward;
  // Return the trial index for referencing and the trial number for display
  return { trial_index: selected_trial[0].trial_index, pit_trial_number: selected_trial[0].pit_trial_number };
}

const PIT_bonus = {
  type: jsPsychHtmlButtonResponse,
  stimulus: "Congratulations! You've finished this game!",
  choices: ['Finish'],
  data: { trialphase: 'pit_bonus' },
  on_start: function (trial) {
    const selected_trial = getSelectedPITtrial();
    trial.stimulus = `
            <p>It is time to reveal your bonus payment for this round of cloudy piggy-bank game.</p>
            <p>The computer selected piggy bank number ${selected_trial.pit_trial_number}, which means you will earn ${(window.sampledPITreward / 100).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })} for the game.</p>
        `;
  },
  on_finish: (data) => {
    data.PIT_bonus = window.sampledPITreward / 100
  },
  simulation_options: {
    simulate: false
  }
};

// Instructions for comparison task
const PITruleInstruction = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div id="instruction-text" style="text-align: left">
      <p><strong>You will now play the same game again for the next few minutes. The rules remain the same:</strong></p>
      <ul>
        <li><img src="imgs/saturate-icon.png" style="height:1.3em; transform: translateY(0.2em)"> <strong>Vividness</strong> of piggy colors: Indicates how hard you need to shake it.</li>
        <li><img src="imgs/tail-icon.png" style="height:1.3em; transform: translateY(0.2em)"> <strong>Tail length</strong>: Longer piggy tails = more valuable coins.</li>
        <li>You can win coins of <strong>1 Penny, 2 Pence, and 5 Pence.</strong></li>
      </ul>
      <p><span class="highlight">But this time, you'll play in a cloudy place.<br>Coins will drop and be collected as usual, but they'll be hidden behind clouds.<br>You won't see them during the game.</span></p>
      <p>We will also pay you the total amount of coins from a randomly selected piggy bank at the end of this round.</p>
      <p>When you're ready, press <span class="spacebar-icon">Spacebar</span> to start!</p>
    </div>
  `,
  data: { trialphase: 'pit_instructions' },
  choices: [' '],
  post_trial_gap: 300,
  simulation_options: {
    simulate: false
  }
};

const PITruleInstruction_2 = {
  type: jsPsychInstructions,
  data: {trialphase: 'vigour_instructions'},
  show_clickable_nav: true,
  pages: [`
  <div id="instruction-text" style="text-align: left">
    <p><strong>You will now play the same game again for the next few minutes. The rules remain the same:</strong></p>

    <ul>
        <li><img src="imgs/saturate-icon.png" style="height:1.3em; transform: translateY(0.2em)"> <span class="highlight">Vividness</span> of piggy colors: Indicates how hard you need to shake it.</li>
        <li><img src="imgs/tail-icon.png" style="height:1.3em; transform: translateY(0.2em)"> <span class="highlight">Tail length</span>: Longer piggy tails = more valuable coins.</li>
    </ul>

    <p>Types of coins you can win:</p>
    <div class="instruct-coin-container">
        <div class="instruct-coin">
            <img src="imgs/1p-num.png" alt="1 Penny">
            <p>1 Penny</p>
        </div>
        <div class="instruct-coin">
            <img src="imgs/2p-num.png" alt="2 Pence">
            <p>2 Pence</p>
        </div>
        <div class="instruct-coin">
            <img src="imgs/5p-num.png" alt="5 Pence">
            <p>5 Pence</p>
        </div>
    </div>
    </div>
    `,
    `<div id="instruction-text" style="text-align: left">
      <p><strong>But this time, you'll play in a cloudy place.</strong></p>
      <img src="imgs/occluding_clouds.png" style="height:13em">
      <p><span class="highlight">Coins will drop and be collected as usual, but they'll be hidden behind clouds.<br>You won't see them during the game.</span></p>
      <p>We will also pay you the total amount of coins from a randomly selected piggy bank at the end of this round.</p>
    </div>
      `],
  simulation_options: {
    simulate: false
  }
};

const startPITconfirmation = {
  type: jsPsychHtmlKeyboardResponse,
  choices: [' ', 'r'],
  stimulus: `
  <div id="instruction-text">
      <p>When you're ready, press <span class="spacebar-icon">Spacebar</span> to start!</p>
      <p>If you want to read the rules again, press <span class="spacebar-icon">R</span>.</p>
  </div>
    `,
  post_trial_gap: 300,
  data: {trialphase: 'pit_instructions'},
  simulation_options: {
    simulate: false
  }
}

const PITinstructions = {
  timeline: [PITruleInstruction_2, startPITconfirmation],
  loop_function: function (data) {
    const last_iter = data.last(1).values()[0];
    if (jsPsych.pluginAPI.compareKeys(last_iter.response, 'r')) {
      return true;
    } else {
      return false;
    }
  }
}