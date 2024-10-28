// This files creates the jsPsych timeline for the reversal task block

// Parameters
const rev_n_trials = 30; // N trials

// Parse json sequence
const reversal_timeline = JSON.parse(reversal_json);

// Assemble list of blocks - first load images
var reversal_blocks = [
    {
        type: jsPsychPreload,
        images: [
            "imgs/squirrels_empty.png",
            "imgs/squirrels_bg.png",
            "imgs/squirrels_fg.png",
            "imgs/1penny.png",
            "imgs/1pound.png"
        ],
        post_trial_gap: 400,
        data: {
            trialphase: "reversal_preload"
        }
    }
];
for (i=0; i<reversal_timeline.length; i++){
    reversal_blocks.push([
        {
            timeline: [
                {
                    timeline: [
                        kick_out,
                        fullscreen_prompt,
                        {
                            type: jsPsychReversal,
                            feedback_right: jsPsych.timelineVariable('feedback_right'),
                            feedback_left: jsPsych.timelineVariable('feedback_left'),
                            optimal_right: jsPsych.timelineVariable('optimal_right'),
                            on_finish: () => {
                                n_trials = jsPsych.data.get().filter({trial_type: "reversal"}).count()
                                
                                if (n_trials % 40 == 0) {
                                    saveDataREDCap(retry = 3);
                                  }
                            }
                        }
                    ],
                    conditional_function: () => {

                        // Check whether participants are up to crtierion
                        const criterion = jsPsych.evaluateTimelineVariable('criterion');

                        let num_correct = jsPsych.data.get()
                            .filter({block: jsPsych.evaluateTimelineVariable('block'), trial_type: 'reversal'})
                            .select('response_optimal').sum()

                        // Check whether trial limit reached
                        let n_trials = jsPsych.data.get()
                        .filter({trial_type: 'reversal'})
                        .count()

                        return (n_trials < rev_n_trials) && (num_correct < criterion)
                },
                on_finish: function(data) {
                    if (data.response === null) {
                        var up_to_now = parseInt(jsPsych.data.get().last(1).select('n_warnings').values);
                        jsPsych.data.addProperties({
                            n_warnings: up_to_now + 1
                        });
                    }
                 },
            }
            ],
            timeline_variables: reversal_timeline[i],
            data: {
                block: jsPsych.timelineVariable('block'),
                trial: jsPsych.timelineVariable('trial'),
                trialphase: "reversal"
            }
        }
    ]);
}

// Reversal instructions
const reversal_instructions = [
    {
        type: jsPsychInstructions,
        css_classes: ['instructions'],
        pages: [
            `<p>Next, you will meet two friendly squirrels, each with a bag of coins to share. 
            Use the arrow keys to choose either the left or right squirrel. 
            The squirrel you pick will give you a coin to add to your safe.</p>`,
            `<p>One squirrel has higher-value coins, and the other has lower-value coins. 
            But sometimes, they secretly switch bags.</p>
            <p>Your goal is to figure out which squirrel has the better coins and collect as many high-value ones as possible.<p>`
        ],
        show_clickable_nav: true,
        data: {trialphase: "reversal_instruction"}
    },
    {
        type: jsPsychHtmlKeyboardResponse,
        css_classes: ['instructions'],
        stimulus: `<p>Place your fingers on the left and right arrow keys, and press either one to continue.</p>`,
        choices: ['arrowleft', 'arrowright'],
        data: {trialphase: "reversal_instruction"}
    },
]
