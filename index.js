'use strict';

let {
    difference
} = require('bolzano');

/**
 * when fun was called, resolve all
 */
module.exports = (fun = id) => {
    let oneTimeResolves = [],
        oneTimeRejects = [];

    let resolveAll = (ret) => {
        Promise.resolve(ret).then((v) => {
            while (oneTimeResolves.length) {
                let resolve = oneTimeResolves.shift();
                resolve(v);
            }
        }).catch(err => {
            rejectAll(err);
        });
        return ret;
    };

    let rejectAll = (err) => {
        while (oneTimeRejects.length) {
            let reject = oneTimeRejects.shift();
            reject(err);
        }
        return err;
    };

    let newHandler = (...args) => {
        try {
            return resolveAll(
                fun(...args)
            );
        } catch (err) {
            throw rejectAll(err);
        }
    };

    // get next result
    newHandler.getNextRet = () => {
        let resolve, reject;
        let p = new Promise((r1, r2) => {
            resolve = r1;
            reject = r2;
        });

        oneTimeResolves.push(resolve);
        oneTimeRejects.push(reject);

        p.cancel = () => {
            oneTimeResolves = difference(oneTimeResolves, [resolve]);
            oneTimeRejects = difference(oneTimeRejects, [reject]);
            let err = new Error(`cancel waiting for result of function ${fun.toString()}`);
            err.type = 'next-ret-cancel';
            reject(err);
        };

        return p;
    };

    newHandler.during = (job) => {
        let p = newHandler.getNextRet();

        return Promise.race([p.then((ret) => {
            return {
                happened: true,
                ret
            };
        }), Promise.resolve(job).then((jobRet) => {
            p.cancel(); // cancel to avoid memory leak
            return {
                happened: false,
                ret: jobRet
            };
        })]);
    };

    return newHandler;
};

let id = v => v;
