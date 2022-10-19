const version = '0.0.1';

const ethers = require('ethers');
const request = require("got");

module.exports = {
    headersForRequest: [],
    bcAddress: '',
    bcHttpProvider: null,
    privateKey: '',
    contractABI: '',
    contractAddress: '',
    contract: null,
    contractVersion: '',
    config: '',
    setConfig: function (configGlobal) {
        this.config = configGlobal.config;
        this.bcAddress = this.config.chain.bcAddressProd;
        this.contractAddress = this.config.token.contractAddressProd;
        this.contractABI = this.config.token.pathToABIProd;
        this.privateKey = this.config.chain.privateKeyProd;
    },
    getABI: async function (URI) {
        return new Promise(async (resolve, reject) => {
            let requestSettings = {
                method: 'GET',
                url: this.config.chain.bcGetABI + 'api?module=contract&action=getabi&address=' + this.config.token.contractAddressProd
            };

            let objRet = {
                err: '',
                result: ''
            };
            console.log('Retrieving ABI ...')
            let response = await request(requestSettings).catch((err) => {
                console.error(err, 'request error');
                objRet.err = err;
            });

            if (response) {
                let body = response.body;
                objRet.result = JSON.parse(body);
            }

            resolve(objRet);
        });
    },
    init: async function () {
        return new Promise(async (resolve, reject) => {
            console.log(this.bcAddress, "Blockchain");
            //this.contractABI = JSON.parse(fs.readFileSync(this.contractABI).toString());
            let ABIFromUrl = await this.getABI();
            this.contractABI = JSON.parse(ABIFromUrl.result.result);
            console.log(this.contractABI);
            this.bcHttpProvider = new ethers.providers.JsonRpcProvider(this.bcAddress);

            this.bcHttpProvider.getBlockNumber().then((result) => {
                console.log(result, "Current block number");
            });

            this.contract = new ethers.Contract(
                this.contractAddress,
                this.contractABI,
                this.bcHttpProvider
            );
            resolve(await this.name());
        });
    },
    name: function () {
        return new Promise(async (resolve, reject) => {
            this.contract.name()
                .then((result) => {
                    console.log(result, "name token");
                    resolve(result);
                })
                .catch(err => {
                    console.error(err.reason, "name token");
                    reject(err.reason);
                })
        });
    },
    totalSupply: function () {
        return new Promise(async (resolve, reject) => {
            this.contract.totalSupply()
                .then((result) => {
                    resolve(result);
                })
                .catch(err => {
                    console.error(err.reason, "totalSupply token");
                    reject(err.reason);
                })
        });
    },
    baseURI: function () {
        return new Promise(async (resolve, reject) => {
            this.contract.baseURI()
                .then((result) => {
                    resolve(result);
                })
                .catch(err => {
                    console.error(err.reason, "base URI");
                    reject(err.reason);
                })
        });
    },
    tokenURI: function (_tokenID) {
        return new Promise(async (resolve, reject) => {
            let tokenID = _tokenID;
            this.contract.tokenURI(tokenID)
                .then((result) => {
                    resolve(result);
                })
                .catch(err => {
                    console.error(err.reason, "token URI");
                    reject(err.reason);
                })
        });
    }
};


