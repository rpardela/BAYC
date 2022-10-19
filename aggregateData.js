const version = '0.0.1';

const bayc_bc_api = require("./bayc_bc_api");
const request = require("got");

const config = bayc_bc_api.config;

let aggregatedDataArray = {};
let allTokens = [];
let duringAggregate = true;

module.exports = {
    getAggregatedData: function () {
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
    getAllTokens: function () {
        return allTokens;
    },
    isBusy: function () {
        return duringAggregate;
    },
    aggregateFromTatum: async function () {
        let howManyReq = config.tatum.howManyReq;
        let reqCount = 0;
        return new Promise(async (resolve, reject) => {
            console.log('Retrieving tokens metadata ...');
            let totalSupply = await bayc_bc_api.totalSupply();
            let tatumUri = config.token.contractAddressProd + '?pageSize=50'
            let i = totalSupply;
            let finished = false;

            for (let i = 0; i <= totalSupply; i += 50) {
                duringAggregate = true;
                if (howManyReq >= reqCount) {
                    reqCount++;
                    this.getFromTatum(tatumUri + '&offset=' + i)
                        .then(res => {
                            reqCount--;
                            for (let k = 0; k < res.result.length; k++) {
                                let metadata = res.result[k].metadata;
                                metadata.imageUrl = config.durableMedium.addressProd + metadata.metadata.image.substring(7, metadata.metadata.image.length);
                                allTokens.push(metadata);
                                for (let k = 0; k < metadata.metadata.attributes.length; k++) {
                                    let data = metadata.metadata.attributes[k];
                                    if (!aggregatedDataArray[data['trait_type']]) {
                                        aggregatedDataArray[data['trait_type']] = {};
                                    }
                                    if (!aggregatedDataArray[data['trait_type']][data['value']]) {
                                        aggregatedDataArray[data['trait_type']][data['value']] = 0;
                                    }
                                    aggregatedDataArray[data['trait_type']][data['value']]++;
                                }
                            }
                            console.log(allTokens.length, "tokens");
                        })
                        .catch(err => {
                            i -= 50;
                            reqCount--;
                            console.error(err);
                            //reject(err);
                        })
                } else {
                    i -= 50;
                    await sleep(config.tatum.timeout);
                }
            }
            duringAggregate = false;
            resolve(aggregatedDataArray)
        });
    },
    /**
     * doesn't work
     */
    aggregateFromTatumTEST: async function () {
        let howManyReg = 10;
        let reqCount = 0;
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Retrieving tokens metadata ...");
                let totalSupply = await bayc_bc_api.totalSupply();
                let tatumUri = config.token.contractAddressProd + "?pageSize=50";
                for (let offset = 0; offset <= totalSupply; offset += 50) {
                    if (reqCount >= howManyReg) {
                        await sleep(500);
                    }
                    reqCount++;
                    this.getFromTatum(tatumUri + "&offset=" + offset).then((res) => {
                        reqCount--;
                        res.result.map((nft) => allTokens.push({
                            ...nft.metadata,
                            imageUrl: config.durableMedium.addressProd + nft.metadata.metadata.image.substring(7, nft.metadata.metadata.image.length),
                        }));
                        console.log(allTokens.length, "tokens");
                    });
                }
                console.log("Total assets: ", allTokens.length);
                resolve(allTokens)
            } catch (e) {
                console.log(e);
            }
        });
    },
    /**
     * now doesn't work with GUI
     */
    aggregateFromBaseUri: async function () {
        return new Promise(async (resolve, reject) => {
            console.log('Retrieving tokens ...');
            let totalSupply = await bayc_bc_api.totalSupply();
            let baseURI = await bayc_bc_api.baseURI();
            console.log('baseURI: ' + baseURI);
            for (let i = 0; i < totalSupply; i++) {
                duringAggregate = true;
                let dmUri = config.durableMedium.addressProd + baseURI.substring(7, baseURI.length) + i;
                //console.log('dmURI: ' + dmUri);
                let res = await this.getFromDM(dmUri);
                //console.log(res);
                let imageUri = '';
                if (res.err) {
                    console.error(res);
                } else {
                    imageUri = config.durableMedium.addressProd + res.result.image.substring(7, res.result.image.length);
                }
                res.result.imageUrl = imageUri;
                allTokens.push({ id: i, meta: res.result });
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

            }
            duringAggregate = false;
            resolve(aggregatedDataArray)
        });
    },
    /**
     * now doesn't work with GUI
     */
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
                        allTokens.push({ id: i, meta: res.result });
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
    },
    getFromTatum: async function (contractAddress) {
        let requestSettings = {
            method: 'GET', url: config.tatum.address + contractAddress,
            headers: {
                'x-api-key': config.tatum['x-api-key']
            }
        };
        let objRet = {
            err: '',
            result: ''
        };
        return new Promise(async (resolve, reject) => {
            let response = await request(requestSettings).catch((err) => {
                console.error(err, 'request error');
                objRet.err = err;
                reject(objRet);
            });

            if (response) {
                let body = response.body;
                objRet.result = JSON.parse(body);
            }
            //return objRet;
            resolve(objRet)
        })
    }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


