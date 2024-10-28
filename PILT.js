// Function setting up PILT blocks
window.maxWarnings = 10;
window.defaultMaxRespTime = 3000;
window.pilt_test_confidence_every = 4;

window.skipThisBlock = false;

// Message between blocks
const inter_block_msg = {
    type: jsPsychHtmlKeyboardResponse,
    choices: ['arrowright', 'arrowleft'],
    css_classes: ['instructions'],
    stimulus: inter_block_stimulus,
    data: {
        trialphase: "inter_block",
    },
    on_start: saveDataREDCap,
    on_finish: () => {window.skipThisBlock = false}
}

// Post-PILT test trial
const test_trial = {
    timeline: [
        kick_out,
        fullscreen_prompt,
    // Test trial
    {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: () => {
            return `<style>
                .optionBox {
                    margin: auto;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                }
                
                .optionSide {
                    display: grid;
                    flex-direction: column;
                    height: 70vh;
                    width: 25vw;
                    max-width: 1000px;
                    position: relative;
                }
                
                .optionSide img {
                    height: auto;
                    width: 20vw;
                    max-width: 500px;
                   /* flex-direction: column;*/
                    margin: auto;
                    grid-column: 1;
                    grid-row: 1;
                }

                #rightImg, #leftImg {
                    border: 1px solid darkgrey;
                }
                
                .helperTxt {
                    display: flex;
                    justify-content: space-around;
                    margin: auto;
                    width: 12vw;
                    max-width: 325px;
                    
                    text-wrap: normal;
                    font-size: 1.5rem;
                    font-weight: bold;
                    line-height: 3rem;
                }
                
                .coin {
                    visibility: hidden;
                    max-width: 12vw;
                    margin: auto;
                }
                
            </style>
            <div id="optionBox" class="optionBox">
                <div id='left' class="optionSide">
                    <img id='leftImg' src=imgs/${jsPsych.evaluateTimelineVariable('stimulus_left')}></img> 
                </div>
                <div class="helperTxt">
                    <h2 id="centerTxt">?</h2>
                </div>
                <div id='right' class="optionSide">
                    <img id='rightImg' src=imgs/${jsPsych.evaluateTimelineVariable('stimulus_right')}></img>
                </div>
            </div>`
        },
        choices: ["ArrowRight", "ArrowLeft"],
        trial_duration: 4000,
        data: {
            trialphase: "PILT_test",
            block: jsPsych.timelineVariable("block"),
            trial: jsPsych.timelineVariable("trial"),
            stimulus_left: jsPsych.timelineVariable("stimulus_left"),
            stimulus_right: jsPsych.timelineVariable("stimulus_right"),
            same_valence: jsPsych.timelineVariable("same_valence"),
            same_block: jsPsych.timelineVariable("same_block"),
            magnitude_left: jsPsych.timelineVariable("magnitude_left"),
            magnitude_right: jsPsych.timelineVariable("magnitude_right"),
            original_block_left: jsPsych.timelineVariable("original_block_left"),
            original_block_right: jsPsych.timelineVariable("original_block_right"),

        }
    },
    // Timeout message
    {
        timeline: [
            {
                type: jsPsychHtmlKeyboardResponse,
                data: {
                    trialphase: "PILT_test_timeout"
                },
                stimulus: () => {
                    return `<style>
                        .optionBox {
                            margin: auto;
                            display: flex;
                            flex-direction: row;
                            justify-content: space-between;
                        }
                        
                        .optionSide {
                            display: grid;
                            flex-direction: column;
                            height: 70vh;
                            width: 25vw;
                            max-width: 1000px;
                            position: relative;
                        }
                        
                        .optionSide img {
                            height: auto;
                            width: 20vw;
                            max-width: 500px;
                           /* flex-direction: column;*/
                            margin: auto;
                            grid-column: 1;
                            grid-row: 1;
                        }
        
                        #rightImg, #leftImg {
                            border: 1px solid darkgrey;
                        }
                        
                        .helperTxt {
                            display: flex;
                            justify-content: space-around;
                            margin: auto;
                            width: 12vw;
                            max-width: 325px;
                            
                            text-wrap: normal;
                            font-size: 1.5rem;
                            font-weight: bold;
                            line-height: 3rem;
                        }
                        
                        .coin {
                            visibility: hidden;
                            max-width: 12vw;
                            margin: auto;
                        }
                        
                    </style>
                    <div id="optionBox" class="optionBox">
                        <div id='left' class="optionSide">
                            <img id='leftImg' src=imgs/${jsPsych.evaluateTimelineVariable('stimulus_left')}></img> 
                        </div>
                        <div class="helperTxt">
                            <h2 id="centerTxt">Please respond more quickly!</h2>
                        </div>
                        <div id='right' class="optionSide">
                            <img id='rightImg' src=imgs/${jsPsych.evaluateTimelineVariable('stimulus_right')}></img>
                        </div>
                    </div>`
                },
                choices: "NO_KEYS",
                trial_duration: 1500
            }
        ],
        conditional_function: () => {
            let missed = jsPsych.data.get().filter({
                trialphase: "PILT_test"
            }).last(1).select("response").values[0] == null

            if (missed){
                // Update warning count
                var up_to_now = parseInt(jsPsych.data.get().last(1).select('n_warnings').values);
                jsPsych.data.addProperties({
                n_warnings: up_to_now + 1
                });
            }

            return missed
        }
    },
    {
        type: jsPsychHtmlKeyboardResponse,
        choices: "NO_KEYS",
        stimulus: "",
        data: {
            trialphase: "PILT_test_ITI"
        },
        trial_duration: 0,
        post_trial_gap: 600
    },
    {
        timeline: [
            {
                type: jsPsychHtmlButtonResponse,
                stimulus: '<p>How confident are you that your last choice was correct?</p>',
                choices: ["1<br>Not at all", "2", "3", "4", "5<br>Very confident"],
                data: {
                    trialphase: "pilt_confidence"
                }
            }
        ],
        conditional_function: () => {
            let missed = jsPsych.data.get().filter({
                trialphase: "PILT_test"
            }).last(1).select("response").values[0] == null

            let n_trials = jsPsych.data.get().filter({
                trialphase: "PILT_test"
            }).count()
    
            return !missed && ((n_trials % window.pilt_test_confidence_every) === (window.pilt_test_confidence_every - 1))
        },
        post_trial_gap: 800
    }
]
};

// Post-PILT test confidence trial

// Build post_PILT test block
function build_post_PILT_test(structure){
    
    // Preload images
    let test = [
        {
            type: jsPsychPreload,
            images: structure[1]
                .flatMap(item => [item.stimulus_right, item.stimulus_left])
                .map(value => `imgs/${value}`),
            post_trial_gap: 800
        }
    ];

    // Push blocks from structure
    for (let i=0; i < structure.length; i++){

        // Push block                
        test.push({
            timeline: [
                test_trial
            ],
            timeline_variables: structure[i]
        });
    }

    return test
}

// Post-PILT test instructions
const test_instructions = {
    type: jsPsychInstructions,
    css_classes: ['instructions'],
    pages: [
        '<p>You will now continue to another round of the card choosing game.</p>\
            <p>The game proceeds the same as before, except you won\'t be able to see the coins you discover and collect.</p>\
            <p>You will be presented with cards you already know. Do you best to choose the best card possible on each turn.</p>'
    ],
    show_clickable_nav: true,
    data: {trialphase: "post-PILT_test_instructions"}
}

// PILT trial
const PLT_trial =  {
    timeline: [
        kick_out,
        fullscreen_prompt,
    {
        type: jsPsychPLT,
        imgLeft: () => 'imgs/'+ jsPsych.evaluateTimelineVariable('stimulus_left'),
        imgRight: () => 'imgs/'+ jsPsych.evaluateTimelineVariable('stimulus_right'),
        outcomeLeft: jsPsych.timelineVariable('feedback_left'),
        outcomeRight: jsPsych.timelineVariable('feedback_right'),
        optimalRight: jsPsych.timelineVariable('optimal_right'),
        maxRespTime: jsPsych.timelineVariable('maxRespTime'),
        data: {
            trialphase: "task",
            block: jsPsych.timelineVariable('block'),
            trial: jsPsych.timelineVariable('trial'),
            stimulus_pair: jsPsych.timelineVariable('pair'),
            stimulus_pair_id: jsPsych.timelineVariable('cpair'),
            valence: jsPsych.timelineVariable('valence'),
            n_pairs: jsPsych.timelineVariable('n_pairs'),
            rest_1pound: jsPsych.timelineVariable('rest_1pound'),
            rest_50pence: jsPsych.timelineVariable('rest_50pence'),
            rest_1penny: jsPsych.timelineVariable('rest_1penny')
        },
        on_finish: function(data) {
            if (data.choice === "noresp") {
                var up_to_now = parseInt(jsPsych.data.get().last(1).select('n_warnings').values);
                jsPsych.data.addProperties({
                    n_warnings: up_to_now + 1
                });
            }
         },
         simulation_options: {
            mode: 'data-only'
         },
        post_trial_gap: 400
    }
    ],
    conditional_function: function(){

        // Only consider stopping if this is an early stop group, if this is not a practice block, and if there had been at least five previous trials
        if (Number.isInteger(jsPsych.evaluateTimelineVariable('block')) && 
            jsPsych.evaluateTimelineVariable('trial') > 5
        ){

                // Block number
                const block = jsPsych.data.get().last(1).select('block').values[0];

                // Find all sitmulus-pairs in block
                let unique_stimulus_pairs =  [...new Set(jsPsych.data.get().filter({
                    trial_type: "PLT",
                    block: block
                }).select('stimulus_pair').values)]

                // Initialize a variable to store the result
                let all_optimal = true;

                // Iterate over each unique stimulus_pair and check the last 5 choices
                unique_stimulus_pairs.forEach(pair => {

                    // Filter data for the current stimulus_pair
                    let num_optimal = jsPsych.data.get().filter({
                        trial_type: "PLT",
                        block: block,
                        stimulus_pair: pair
                    }).last(5).select('isOptimal').sum();

                    // Check if all last 5 choices for this pair are correct
                    if (num_optimal < 5) {
                        all_optimal = false;
                    }
                });

                if (all_optimal) {
                    window.skipThisBlock = true;
                }

                return !all_optimal
        }else{
            return true
        }
        
    }
} 

// Coin lottery trial
const coin_lottery = {
    type: jsPsychCoinLottery,
    coins: () => {
        const coins_from_data = get_coins_from_data();

        return createProportionalArray(coins_from_data, 35)
    },
    props: () => {

        // Compute data proportion
        const coins_from_data = get_coins_from_data();

        let raw_props = computeCategoryProportions(coins_from_data);

        raw_props = [raw_props[0.01], raw_props[0.5], raw_props[1]]

        const prior = [0.1, 0.3, 0.6];

        // Take weighted average
        const weight_data = 0.6;

        let weightedSum = raw_props.map((value, index) => {
            return (value * weight_data) + (prior[index] * (1 - weight_data));
        });

        // Normalize and return
        let sum = weightedSum.reduce((acc, value) => acc + value, 0);
        return weightedSum.map(value => value / sum);
    }
}

// Build PILT task block
function build_PLT_task(structure, insert_msg = true){
    let PLT_task = [];
    for (let i=0; i < structure.length; i++){

        // Set default value of maxRespTime
        structure[i].forEach(trial => {
            if (!trial.hasOwnProperty('maxRespTime')) {
                trial.maxRespTime = window.defaultMaxRespTime; // Add the default value if missing
            }
        });

        // Get list of unique images in block to preload
        let preload_images = structure[i].flatMap(item => [item.stimulus_right, item.stimulus_left]);
        preload_images = [...new Set(preload_images)].map(value => `imgs/${value}`);

        // Build block
        block = [
            {
                type: jsPsychPreload,
                images: preload_images,
                post_trial_gap: 800
            },
            {
                timeline: [
                    PLT_trial
                ],
                timeline_variables: structure[i]
            }
        ];
        
        // Add message
        if (insert_msg){
            block.push(inter_block_msg);
        }
        
        PLT_task = PLT_task.concat(block)
    }

    return PLT_task
}

// Load PILT sequences from json file
async function load_squences(session) {
    try {
        // Fetch PILT sequences
        const response = await fetch('pilot4_pilt.json');
        
        if (!response.ok) {
        throw new Error('Network response was not ok');
        }
        const structure = await response.json();
        const sess_structure = structure[session - 1];

        window.totalBlockNumber = sess_structure.length

        // Fetch post-PILT test sequences
        const test_response = await fetch('pilot4_pilt_test.json');

        if (!test_response.ok) {
            throw new Error('Network response was not ok');
        }

        const test_structure = await test_response.json();
        const test_sess_structure = test_structure[session - 1];


        run_full_experiment(sess_structure, test_sess_structure);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

function return_PILT_full_sequence(structure, test_structure){
    // Compute best-rest
    computeBestRest(structure);

    let procedure = [];

    // Add instructions
    procedure = procedure.concat(prepare_PILT_instructions());

    // Add PLT
    procedure = procedure.concat(build_PLT_task(structure));

    // Add test
    procedure.push(test_instructions);
    procedure = procedure.concat(build_post_PILT_test(test_structure));

    return procedure
}