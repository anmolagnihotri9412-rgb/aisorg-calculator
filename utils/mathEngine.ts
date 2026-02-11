
/**
 * A safe mathematical evaluator that supports scientific functions.
 */
export const evaluateExpression = (expr: string): string => {
  try {
    if (!expr) return "0";

    // Replace visual operators with JS operators
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**');

    // Context for evaluation
    const context = {
      sin: (x: number) => Math.sin(x),
      cos: (x: number) => Math.cos(x),
      tan: (x: number) => Math.tan(x),
      sqrt: (x: number) => Math.sqrt(x),
      log: (x: number) => Math.log10(x),
      ln: (x: number) => Math.log(x),
      abs: (x: number) => Math.abs(x),
      fact: (n: number) => {
        if (n < 0) return NaN;
        if (n === 0) return 1;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
      },
      PI: Math.PI,
      E: Math.E
    };

    const keys = Object.keys(context);
    const values = Object.values(context);
    
    // Evaluate using a safe-ish function constructor
    // We pass our context as arguments to the function
    const func = new Function(...keys, `return ${sanitized}`);
    const result = func(...values);

    if (result === undefined || result === null || isNaN(result)) return "Error";
    if (!isFinite(result)) return "Infinity";

    // Format result to avoid long floating point strings
    const numResult = Number(result);
    if (Math.abs(numResult) < 1e-10 && numResult !== 0) return "0";
    
    const resultStr = numResult.toString();
    if (resultStr.includes('.') && resultStr.split('.')[1].length > 8) {
        return parseFloat(numResult.toFixed(8)).toString();
    }
    return resultStr;
  } catch (err) {
    console.error("Math Engine Error:", err, "Expression:", expr);
    return "Error";
  }
};
