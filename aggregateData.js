const version = '0.0.1';

const bayc_bc_api = require("./bayc_bc_api");
const request = require("got");

const config = bayc_bc_api.config;

let aggregatedDataArray = {};
let allTokens = [];
let duringAggregate = true;
    
module.exports = {
    getAggregatedData: function() {
        const sorted_object = Object.fromEntries(
            Object.entries(aggregatedDataArray)
                .sort((a, b) => {
                    if (a[0] < b[0]) {
                        return -1;
                    }
                    if (b[0] < a[0]) {
                        return 1;
                    }
                    return 0;
                })
        );

        return sorted_object;
    },
    getAllTokens: function() {
        return allTokens;
    },
    isBusy: function() {
        return duringAggregate;
    },
    aggregate: async function () {
        return new Promise(async (resolve, reject) => {
            console.log('Retrieving tokens ...');
            let totalSupply = await bayc_bc_api.totalSupply();
            for (let i = 0; i < totalSupply; i++) {
                duringAggregate = true;
                await bayc_bc_api.tokenURI(i)
                    .then(async (result) => {
                        let dmUri = config.durableMedium.addressProd + result.substring(7, result.length);
                        let res = await this.getFromDM(dmUri);
                        let imageUri = '';
                        if (res.err) {
                            console.error(res);
                        } else {
                            imageUri = config.durableMedium.addressProd + res.result.image.substring(7, res.result.image.length);
                        }
                        res.result.imageUrl = imageUri;
                        allTokens.push({id: i, meta: res.result});
                        for (let k = 0; k < res.result.attributes.length; k++) {
                            let data = res.result.attributes[k];
                            if (!aggregatedDataArray[data['trait_type']]) {
                                aggregatedDataArray[data['trait_type']] = {};
                            }
                            if (!aggregatedDataArray[data['trait_type']][data['value']]) {
                                aggregatedDataArray[data['trait_type']][data['value']] = 0;
                            }
                            aggregatedDataArray[data['trait_type']][data['value']]++;
                        }
                        console.log(i, "token ID");
                    })
                    .catch(err => {
                        console.error(err, 'token geturi');
                        duringAggregate = false;
                        reject(err);
                    });
            }
            duringAggregate = false;
            resolve(aggregatedDataArray)
        });
    },
    getFromDM: async function (URI) {
        let requestSettings = {
            method: 'GET', url: URI
        };

        let objRet = {
            err: '',
            result: ''
        };
        let response = await request(requestSettings).catch((err) => {
            console.error(err, 'request error');
            objRet.err = err;
        });

        if (response) {
            let body = response.body;
            objRet.result = JSON.parse(body);
        }

        return objRet;
    }
};


