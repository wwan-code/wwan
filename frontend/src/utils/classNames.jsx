const hasOwn = {}.hasOwnProperty;

export default function classNames(...args) {
    return args.reduce((classes, arg) => {
        if (arg) {
            return appendClass(classes, parseValue.call(this, arg));
        }
        return classes;
    }, '');
}

function parseValue(arg) {
    if (typeof arg === 'string') {
        return (this && this[arg]) || arg;
    }

    if (typeof arg !== 'object') {
        return '';
    }

    if (Array.isArray(arg)) {
        return classNames.apply(this, arg);
    }

    if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes('[native code]')) {
        return arg.toString();
    }

    return Object.entries(arg).reduce((classes, [key, value]) => {
        if (hasOwn.call(arg, key) && value) {
            return appendClass(classes, (this && this[key]) || key);
        }
        return classes;
    }, '');
}

function appendClass(value, newClass) {
    return newClass ? ((value ? `${value} ${newClass}` : newClass)) : value;
}