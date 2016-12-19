'use strict';

let observe = require('..');

let assert = require('assert');

let {
    delay
} = require('jsenhance');

describe('index', () => {
    it('base', (done) => {
        let add = observe((a, b) => a + b);

        add.getNextRet().then((ret) => {
            assert.equal(ret, 3);
            done();
        });

        add(1, 2);
    });

    it('once', (done) => {
        let add = observe((a, b) => a + b);
        let count = 0;

        add.getNextRet().then((ret) => {
            count++;
            assert.equal(ret, 3);
        });

        add.getNextRet().then((ret) => {
            assert.equal(ret, 3);
            assert(count, 1);
            done();
        });

        add(1, 2);
        add(5, 2);
    });

    it('during', (done) => {
        let add = observe((a, b) => a + b);

        let job = delay(20).then(() => {
            return 4;
        });

        add.during(job).then(({
            happened, ret
        }) => {
            assert.equal(happened, true);
            assert.equal(ret, 3);
            done();
        });

        add(1, 2);
    });

    it('during2', () => {
        let add = observe((a, b) => a + b);

        let job = delay(20).then(() => {
            return 4;
        });

        delay(10).then(() => {
            add(1, 2);
        });

        return add.during(job).then(({
            happened, ret
        }) => {
            assert.equal(happened, true);
            assert.equal(ret, 3);
        });
    });

    it('during3', () => {
        let add = observe((a, b) => a + b);

        let job = delay(20).then(() => {
            return 4;
        });
        delay(30).then(() => {
            add(1, 2);
        });

        return add.during(job).then(({
            happened, ret
        }) => {
            assert.equal(happened, false);
            assert.equal(ret, 4);
        });
    });

    it('using as general handler', () => {
        let handler = observe();

        let count = 0;
        handler.getNextRet().then(() => {
            count++;
        });

        handler.getNextRet().then(() => {
            count++;
        });

        // called by outside
        return delay(10).then(handler).then(() => {
            return delay(0);
        }).then(() => {
            assert.equal(count, 2);
        });
    });

    it('error', () => {
        let f = observe(() => {
            throw new Error('123');
        });

        delay(0).then(() => {
            try {
                f();
            } catch (err) {
                //
            }
        });

        return f.getNextRet().catch(err => {
            assert.equal(err.toString().trim(), 'Error: 123');
        });
    });

    it('promise error', () => {
        let f = observe(() => {
            return Promise.reject(new Error('123'));
        });

        delay(0).then(f).catch(() => {});

        return f.getNextRet().catch(err => {
            assert.equal(err.toString().trim(), 'Error: 123');
        });
    });
});
