// Prevent refreshing the page
function preventRefresh(e) {
    // Cancel the event
    e.preventDefault();
    e.returnValue = '';
  }
  
// Make sure fullscreen is kept, warn otherwise and return to full screen
const fullscreen_prompt = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    css_classes: ['instructions'],
    timeline: [
      {
        message: `<p>This study only runs in full screen mode.<p>
            <p>Press the button below to return to full screen mode and continue.</p>`
      }
    ],
    conditional_function: check_fullscreen,
    on_finish: function() {
      // Update warning count
      var up_to_now = parseInt(jsPsych.data.get().last(1).select('n_warnings').values);
      jsPsych.data.addProperties({
        n_warnings: up_to_now + 1
      });
    },
    data: {
      trialphase: 'fullscreen-prompt'
    }
}

const kick_out = {
    type: jsPsychHtmlKeyboardResponse,
    conditional_function: function() {
      if (jsPsych.data.get().last(1).select('n_warnings').values[0] >= window.maxWarnings) {
        return true;
      } else {
        return false;
      }
    },
    css_classes: ['instructions'],
    timeline: [
        {   
            stimulus: '...',
            trial_duration: 200,
            on_finish: function(trial) {
                // Save data
                saveDataREDCap(retry = 3);
                // Allow refresh
                window.removeEventListener('beforeunload', preventRefresh);
            }
        },
        {
        stimulus: `<p>It seems that you are not following the study instructions.</p>
            <p>Unfortunately, you cannot continue with this study.</p>
            <p>If you believe this is a mistake, please email haoyang.lu@ucl.ac.uk, explaining the circumstances.</p>
            <p>Please return this study on Prolific.</p>
            <p>You may now close this tab.</p>
        `
        }
    ],
    choices: ["NO_KEYS"],
    data: {
      trialphase: 'kick-out'
    }
}
  
  
  // Function that checks for fullscreen
function check_fullscreen(){
    if (window.debug){
        return false
    }

    var int = jsPsych.data.getInteractionData(),
    exit = int.values().filter(function(e){
        return e.event == "fullscreenexit"
    }),
    enter = int.values().filter(function(e){
        return e.event == "fullscreenenter"
    });

    if (exit.length > 0){
        return exit[exit.length - 1].time > enter[enter.length - 1].time
    }else{
        return false
    }
}
  

// Save data to REDCap
function saveDataREDCap(retry = 1, callback = () => {}) {

    const auto_number = window.record_id == undefined

    console.log(auto_number)

    var jspsych_data = jsPsych.data.get().ignore('stimulus').json();

    var redcap_record = JSON.stringify([{
        record_id: auto_number ? 1 : window.record_id, // Mandatory, but if auto_number then ignored by REDcap
        prolific_pid: window.prolificPID,
        study_id: window.studyId,
        session_id: window.sessionId,
        start_time: jsPsych.getStartTime(),
        jspsych_data: jspsych_data,
        auto_number: auto_number ? 'true' : 'false'
    }])

    fetch('https://h6pgstm0f9.execute-api.eu-north-1.amazonaws.com/prod/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: redcap_record
    })
    .then(data => {
        if (data.status === 200) {
            console.log('Data successfully submitted to REDCap');
        } else {
            console.error('Error submitting data:', data.message);
        }
        return data.json()
    })
    .then(data => {
        console.log(data)
        if (auto_number){
            window.record_id = JSON.parse('[' + data.record_import_response[0] + ']')[0]
        }
        callback(); // Call the callback function if submission is successful
    }
    )
    .catch(error => {
        console.error('Error:', error);
        if (retry > 0) {
            console.log('Retrying to submit data...');
            saveDataREDCap(retry - 1);
        } else {
            console.error('Failed to submit data after retrying.');
            callback(error); // Call the callback function with the error if retries are exhausted
        }
    });
}

// Function to call at the end of the experiment
function end_experiment() {

    saveDataREDCap(3, (error) => {
        if (error) {
            console.error('Failed to save data:', error);
            // Handle the error appropriately, maybe notify the user or retry
        } else {
            // Allow refresh
            window.removeEventListener('beforeunload', preventRefresh);

            // Redirect
            window.location.replace("https://app.prolific.com/submissions/complete?cc=CQTRGXFP")
        }
    });
}

// Function for formatting data from API
function format_date_from_string(s){
    const dateTime = new Date(s);

    // Get individual components
    const year = dateTime.getFullYear();
    const month = String(dateTime.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(dateTime.getDate()).padStart(2, '0');
    const hours = String(dateTime.getHours()).padStart(2, '0');
    const minutes = String(dateTime.getMinutes()).padStart(2, '0');
    const seconds = String(dateTime.getSeconds()).padStart(2, '0');

    // Format the date and time
    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    return formattedDate + "_" + formattedTime
}

// Functions for computing remaining feedback after early stop
function countPLTAfterLastNonPLT(arr) {
    let count = 0;
    let foundNonPLT = false;
    
    // Iterate from the end to the beginning of the array
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== "PLT") {
        // If a non-PLT string is found, stop the iteration
        foundNonPLT = true;
        break;
      } else {
        // If foundNonPLT is true and we encounter "PLT", increase the count
        count++;
      }
    }
  
    return count;
}

// Find maximum of two vectors in each positin, and return sum
function getSumofMax(arr1, arr2) {
    function add(accumulator, a) {
        return accumulator + a;
      }
      
// Assuming arr1 and arr2 are of the same length
    return arr1.map((value, index) => Math.max(value, arr2[index])).reduce(add, 0);
}

// Extract observed coins for lottery
function get_coins_from_data() {
    // Get block numbers for filtering
    let blocks = jsPsych.data.get().filter({trial_type: "PLT"}).select('block').values;

    // Get block valence for each trial
    let valence = jsPsych.data.get().filter({trial_type: "PLT"}).select('valence').values;

    // Get left and right outcome for each trial
    let outcomeRight = jsPsych.data.get().filter({trial_type: "PLT"}).select('outcomeRight').values;
    let outcomeLeft = jsPsych.data.get().filter({trial_type: "PLT"}).select('outcomeLeft').values;

    // Get choice
    let choice = jsPsych.data.get().filter({trial_type: "PLT"}).select('choice').values;

    let coins_for_lottery = []
    for (i=0; i<valence.length; i++){

        if ((typeof blocks[i] !== "number") || choice[i] == "noresp"){

            continue
        }

        if (valence[i] == 1){
            coins_for_lottery.push(choice[i] == "right" ? outcomeRight[i] : outcomeLeft[i]);

        } else {
            coins_for_lottery.push(choice[i] == "right" ? -outcomeLeft[i] : -outcomeRight[i]);

        }
    }

    return coins_for_lottery
}

function computeCategoryProportions(originalArray){
    // Step 1: Calculate the frequency of each unique float value
    const frequencyMap = {};
    originalArray.forEach(value => {
        if (frequencyMap[value]) {
            frequencyMap[value]++;
        } else {
            frequencyMap[value] = 1;
        }
    });

    // Step 2: Calculate the proportions
    const totalSize = originalArray.length;
    const proportionMap = {};
    for (let value in frequencyMap) {
        proportionMap[value] = frequencyMap[value] / totalSize;
    }

    return proportionMap
}

// Create a represantative array of coins of n length
function createProportionalArray(originalArray, newSize) {
    
    // Steps 1 and 2: Compute proportions
    const proportionMap = computeCategoryProportions(originalArray);

    // Step 3: Calculate the counts for the new array
    const newCounts = {};
    let sumCounts = 0;
    for (let value in proportionMap) {
        newCounts[value] = Math.floor(proportionMap[value] * newSize);
        sumCounts += newCounts[value];
    }

    // Step 4: Distribute the remaining elements to ensure the new array has the correct size
    let remainingElements = newSize - sumCounts;
    while (remainingElements > 0) {
        for (let value in newCounts) {
            if (remainingElements > 0) {
                newCounts[value]++;
                remainingElements--;
            }
        }
    }

    // Step 5: Create the new array based on the calculated counts
    const newArray = [];
    for (let value in newCounts) {
        for (let i = 0; i < newCounts[value]; i++) {
            newArray.push(parseFloat(value)); // Convert the key back to float
        }
    }

    return newArray;
}

// Compute the remaining nubmer of 1 pound, 50 pence, 1 penny, when they are the best option.
function computeBestRest(structure){
    for (let b=0; b<structure.length; b++){

        // Initiate counter at last trial as zero
        structure[b][structure[b].length - 1].rest_1pound = 0;
        structure[b][structure[b].length - 1].rest_50pence = 0;
        structure[b][structure[b].length - 1].rest_1penny = 0;

        // Compute reverse cumulative sums
        for (let i=structure[b].length - 2; i>=0; i--){
            const next_optimal_outcome = structure[b][i + 1].optimal_right === 1 ? structure[b][i + 1].feedback_right : structure[b][i + 1].feedback_left

            structure[b][i].rest_1pound = structure[b][i + 1].rest_1pound + 
                (Math.abs(next_optimal_outcome) == 1);

            structure[b][i].rest_50pence = structure[b][i + 1].rest_50pence + 
                (Math.abs(next_optimal_outcome) == 0.5);

            structure[b][i].rest_1penny = structure[b][i + 1].rest_1penny + 
                (Math.abs(next_optimal_outcome) == 0.01);
        }
    }
}

// Count occurances
function countOccurrences(array) {
    const counts = new Map();
  
    array.forEach(float => {
      if (counts.has(float)) {
        counts.set(float, counts.get(float) + 1);
      } else {
        counts.set(float, 1);
      }
    });
  
    return Object.fromEntries(counts);
}

function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}


// Function to compile inter_block_stimulus
function inter_block_stimulus(){

    const last_trial = jsPsych.data.get().filter({trial_type: "PLT"}).last(1);

    // Valence of block
    const valence = last_trial.select("valence").values[0];
    
    // Block number for filtering
    const block = last_trial.select('block').values[0];

    // Number of pairs in block
    const n_pairs = last_trial.select("n_pairs").values[0]

    // Find chosen outcomes for block
    let chosen_outcomes = jsPsych.data.get().filter({trial_type: "PLT",
        block: block
    }).select('chosenOutcome').values;

    // Summarize into counts
    chosen_outcomes = countOccurrences(chosen_outcomes);

    // Initiate text
    let txt = ``

    // Add text and tallies for early stop
    if (window.skipThisBlock){
        
        txt += `<p>You've found the better ${n_pairs > 1 ? "cards" : "card"}.</p><p>You will skip the remaining turns and `;
        
        txt += valence == 1 ? `collect the remaining coins hidden under ` : 
            `lose only the remaining coins hidden under`;

        txt +=  n_pairs > 1 ? "these cards." : "this card."
        
        txt += `<p><img src='imgs/safe.png' style='width:100px; height:100px;'></p>
        <p>Altogether, these coins were ${valence == 1 ? "added to your safe" : "broken and removed from your safe"} on this round:<p>`
        
        // Add rest to outcomes
        chosen_outcomes[valence * 1] += last_trial.select('rest_1pound').values[0];
        chosen_outcomes[valence * 0.5] += last_trial.select('rest_50pence').values[0];
        chosen_outcomes[valence * 0.01] += last_trial.select('rest_1penny').values[0];

    } else {
        txt += `<p><img src='imgs/safe.png' style='width:100px; height:100px;'></p>
        <p>These coins ${isValidNumber(block) ? "were" : "would have been"} 
        ${valence == 1 ? "added to your safe" : "broken and removed from your safe"} on this round:</p>`
    }

    if (valence == 1){

        txt += `<div style='display: grid'><table><tr>
            <td><img src='imgs/1pound.png' style='width:${small_coin_size}px; height:${small_coin_size}px;'></td>
            <td><img src='imgs/50pence.png' style='width:${small_coin_size}px; height:${small_coin_size}px;'</td>
            <td><img src='imgs/1penny.png' style='width:${small_coin_size}px; height:${small_coin_size}px;'></td>
            </tr>
            <tr>
            <td>${isValidNumber(chosen_outcomes[1]) ? chosen_outcomes[1] : 0}</td>
            <td>${isValidNumber(chosen_outcomes[0.5]) ? chosen_outcomes[0.5] : 0}</td>
            <td>${isValidNumber(chosen_outcomes[0.01]) ? chosen_outcomes[0.01] : 0}</td>
            </tr></table></div>`;
    } else {
        txt += `<div style='display: grid'><table>
            <tr><td><img src='imgs/1poundbroken.png' style='width:${small_coin_size}px; height:${small_coin_size}px;'></td>
            <td><img src='imgs/50pencebroken.png' style='width:${small_coin_size}px; height:${small_coin_size}px;'</td>
            <td><img src='imgs/1pennybroken.png' style='width:${small_coin_size}px; height:${small_coin_size}px;'></td>
            </tr>
            <tr>
            <td>${isValidNumber(chosen_outcomes[-1]) ? chosen_outcomes[-1] : 0}</td>
            <td>${isValidNumber(chosen_outcomes[-0.5]) ? chosen_outcomes[-0.5] : 0}</td>
            <td>${isValidNumber(chosen_outcomes[-0.01]) ? chosen_outcomes[-0.01] : 0}</td>
            </tr></table></div>`;
    }

    if (isValidNumber(block)){
        txt += `<p>Place your fingers on the left and right arrow keys, and press either one to continue.</p>`
    }

    return txt
}
