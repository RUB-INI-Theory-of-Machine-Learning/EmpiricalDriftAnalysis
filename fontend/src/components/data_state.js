import * as d3 from "d3";
import {ref} from 'vue'
import * as _ from 'lodash'

class DataStore {
    constructor() {
        this.raw_data = null

        this.alpha_sequence = null;
        this.kappa_sequence = null;
        this.sigma_sequence = null;

        this.stable_kappa = null;
        this.stable_sigma = null;

        this.data_mode = ref('drift'); // drift, influence
        this.scale_mode = ref('values');// values, quantiles
        this.potential_term_idx = ref(0);
        this.potential_term_flag = false

        this.potential_vector = ref([]);

        this.data_map = {
            drift: [],
            influence: []
        };

        this.scales = {
            drift: null,
            no_drift: null
        }
    }

    sigma_slice(kappa_idx) { // for which kappa do I want all sigmas
        return this.data_map.drift.map(alpha => alpha[kappa_idx]);
    }

    kappa_slice(sigma_idx) { // for which sigma do I want all kappas
        return this.data_map.drift.map(alpha => alpha.map(kappa => kappa[sigma_idx]));
    }

    map(alpha_idx, kappa_idx, sigma_idx) {
        if (this.potential_term_flag) {
            return this.data_map[this.data_mode.value][alpha_idx][kappa_idx][sigma_idx][this.potential_term_idx.value]
        } else {
            return this.data_map[this.data_mode.value][alpha_idx][kappa_idx][sigma_idx];
        }
    }

    color(alpha_idx, kappa_idx, sigma_idx) {
        let value = this.map(alpha_idx, kappa_idx, sigma_idx)

        if (value === 0) {
            return "white";
        } else if (value < 0) {
            return this.scales.drift(value);
        } else if (value > 0) {
            return this.scales.no_drift(value);
        }
    }

    asymptotic_trend(alpha_idx, axis, direction, bound) {
        // let kappa_idx = 0
        // this.data_map[this.data_mode.value][alpha_idx][kappa_idx].filter(e)
        // const result = regression.linear([[0, 1], [32, 67], [12, 79]]);
        // const gradient = result.equation[0];
        // const yIntercept = result.equation[1];
        //
        // console.log(result)
    }

    initialize(data) {
        this.raw_data = data;
        this.alpha_sequence = data.sequences.find(e => e.name === "alpha").sequence;
        this.kappa_sequence = data.sequences.find(e => e.name === "kappa").sequence;
        this.sigma_sequence = data.sequences.find(e => e.name === "sigma").sequence;

        this.stable_kappa = data.stable_kappa;
        this.stable_sigma = data.stable_sigma;

        for (let alpha_i = 0; alpha_i < this.alpha_sequence.length; alpha_i++) {
            this.data_map.drift.push([])
            this.data_map.influence.push([])
            for (let kappa_i = 0; kappa_i < this.kappa_sequence.length; kappa_i++) {
                this.data_map.drift[alpha_i].push([])
                this.data_map.influence[alpha_i].push([])
                for (let sigma_i = 0; sigma_i < this.sigma_sequence.length; sigma_i++) {
                    this.data_map.drift[alpha_i][kappa_i].push(0)
                    this.data_map.influence[alpha_i][kappa_i].push([])
                }
            }
        }
    }


    calc_data_map(potential_vector) {
        for (let alpha_i = 0; alpha_i < this.alpha_sequence.length; alpha_i++) {
            for (let kappa_i = 0; kappa_i < this.kappa_sequence.length; kappa_i++) {
                for (let sigma_i = 0; sigma_i < this.sigma_sequence.length; sigma_i++) {
                    // add the drift terms weighted with the potential vector
                    let combined_drift = 0;
                    let combined_influence = 0;
                    for (let i = 0; i < potential_vector.length; i++) {
                        if (potential_vector[i][0]) {
                            combined_influence += Math.abs(data.drift[alpha_i][kappa_i][sigma_i][i] * potential_vector[i][1]);
                            combined_drift += data.drift[alpha_i][kappa_i][sigma_i][i] * potential_vector[i][1]
                        }
                    }
                    this.data_map.drift[alpha_i][kappa_i][sigma_i] = combined_drift
                    this.data_map.influence[alpha_i][kappa_i][sigma_i] = [];
                    for (let i = 0; i < potential_vector.length; i++) {
                        this.data_map.influence[alpha_i][kappa_i][sigma_i].push((this.raw_data.drift[alpha_i][kappa_i][sigma_i][i] * potential_vector[i][1]) / combined_influence)
                    }
                }
            }
        }

        this.set_scale_mode(this.scale_mode.value)
        this.potential_vector.value = _.cloneDeep(potential_vector);
    }

    set_potential_term_idx(idx) {
        this.potential_term_idx.value = idx
        this.set_scale_mode(this.scale_mode.value);
    }

    set_data_mode(new_mode) {
        this.data_mode.value = new_mode;
        this.potential_term_flag = Array.isArray(this.data_map[this.data_mode.value][0][0][0]);
        this.set_scale_mode(this.scale_mode.value)
    }

    set_scale_mode(new_mode) {
        let local_data = this.potential_term_flag ?
            this.data_map[this.data_mode.value].map(threeD => threeD.map(twoD => twoD.map(oneD => oneD[this.potential_term_idx.value]))).flat(Infinity) :
            this.data_map.drift.flat(Infinity)


        if (new_mode === "values") {
            this.scales = {
                drift: d3.scaleSequential([0, d3.min(local_data)], d3.interpolateGnBu),
                no_drift: d3.scaleSequential([0, d3.max(local_data)], d3.interpolateOrRd)
            };

        }
        if (new_mode === 'quantiles') {
            this.scales = {
                drift: d3.scaleQuantile(local_data.filter(e => e < 0), Array.from({length: 128}, (_, i) => d3.interpolateGnBu(1 - i / 127))),
                no_drift: d3.scaleQuantile(local_data.filter(e => e > 0), Array.from({length: 128}, (_, i) => d3.interpolateOrRd(i / 127)))
            };
        }

        this.scale_mode.value = new_mode;
    }

}

// Export a singleton instance
import data from '/src/data/full_run_dense_grid.json';
// import data from '/src/data/full_run_wide_grid_kappa.json';
// import data from '/src/data/full_run_wide_grid_sigma.json';
// import data from '/src/data/special_run.json';

const store = new DataStore();
store.initialize(data)
store.calc_data_map([[true, 1], [true, 0.34], [true, 0.15], [false, -0.01]])
export default store;

