/**
 * @fileoverview added by tsickle
 * Generated from: test_files/async_functions/async_functions.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
goog.module('test_files.async_functions.async_functions');
var module = module || { id: 'test_files/async_functions/async_functions.ts' };
const tslib_1 = goog.require('tslib');
/**
 * Exercises various forms of async functions.  When TypeScript downlevels these functions, it
 * inserts a reference to 'this' which then tickles a Closure check around whether 'this' has a
 * known type.
 */
/**
 * @param {string} param
 * @return {!Promise<string>}
 * @this {*}
 */
function asyncTopLevelFunction(param) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        /** @type {string} */
        const s = yield 'a';
        return s;
    });
}
exports.asyncTopLevelFunction = asyncTopLevelFunction;
/**
 * @this {!Container}
 * @param {string} param
 * @return {!Promise<string>}
 */
function asyncTopLevelFunctionWithThisType(param) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        /** @type {number} */
        const s = yield 3;
        return s + this.field;
    });
}
exports.asyncTopLevelFunctionWithThisType = asyncTopLevelFunctionWithThisType;
/** @type {function(string): !Promise<string>} */
const asyncTopLevelArrowFunction = (/**
 * @param {string} param
 * @return {!Promise<string>}
 */
(param) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    /** @type {number} */
    const s = yield 3;
    return s + ((/** @type {?} */ (this))).field;
}));
class Container {
    constructor() {
        this.field = 'y';
    }
    /**
     * @return {!Promise<string>}
     */
    asyncMethod() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            /** @type {string} */
            const s = yield asyncTopLevelFunction('x');
            return s + this.field;
        });
    }
    /**
     * @return {void}
     */
    containerMethod() {
        /** @type {function(string): !Promise<string>} */
        const asyncArrowFunctionInMethod = (/**
         * @param {string} param
         * @return {!Promise<string>}
         */
        (param) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            /** @type {number} */
            const s = yield 3;
            return s + this.field;
        }));
        /**
         * @this {!Container}
         * @param {string} param
         * @return {!Promise<string>}
         */
        function asyncFunctionInMethod(param) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                /** @type {number} */
                const s = yield 3;
                return s + this.field;
            });
        }
    }
    /**
     * @return {!Promise<string>}
     */
    static asyncStaticMethod() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            /** @type {string} */
            const s = yield asyncTopLevelFunction('x');
            return s + this.staticField;
        });
    }
}
Container.staticField = 's';
if (false) {
    /** @type {string} */
    Container.staticField;
    /** @type {string} */
    Container.prototype.field;
}
// TODO(#1099): uncomment this test after the async emit is fixed.
// const asyncFnExpression = async function f() {};
/** @type {function(): !Promise<void>} */
const asyncArrowFn = (/**
 * @return {!Promise<void>}
 */
() => tslib_1.__awaiter(this, void 0, void 0, function* () { }));
/** @type {function(): !Promise<void>} */
exports.exportedAsyncArrowFn = (/**
 * @return {!Promise<void>}
 */
() => tslib_1.__awaiter(this, void 0, void 0, function* () { }));
/**
 * @return {function(): !Promise<number>}
 * @this {*}
 */
function toplevelContainingAsync() {
    return (/**
     * @return {!Promise<number>}
     */
    () => tslib_1.__awaiter(this, void 0, void 0, function* () { return 3; }));
}
exports.toplevelContainingAsync = toplevelContainingAsync;
/**
 * @this {string}
 * @return {function(): !Promise<number>}
 */
function toplevelWithThisType() {
    return (/**
     * @return {!Promise<number>}
     */
    () => tslib_1.__awaiter(this, void 0, void 0, function* () { return 3; }));
}
exports.toplevelWithThisType = toplevelWithThisType;
