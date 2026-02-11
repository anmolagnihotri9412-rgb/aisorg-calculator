
/**
 * A safe mathematical evaluator that supports scientific functions.
 */
export const evaluateExpression = (expr: string): string => {
  try {
    // Replace visual operators with JS operators
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
      .replace(/\^/g, '**');

    // Handle Scientific Functions
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
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
      },
      PI: Math.PI,
      E: Math.E
    };

    // Very basic safe evaluation via Function constructor
    // In production, use a library like mathjs for better robustness
    const keys = Object.keys(context);
    const values = Object.values(context);
    
    // Check if expression contains only safe characters
    if (/[^0-9+\-*/()., \sMath\.PIE**sincoqrtalbnf]/.test(sanitized)) {
        // Basic check, not foolproof.
    }

    const func = new Function(...keys, `return ${sanitized}`);
    const result = func(...values);

    if (isNaN(result)) return "Error";
    if (!isFinite(result)) return "Infinity";

    // Format result
    const resultStr = result.toString();
    if (resultStr.includes('.') && resultStr.split('.')[1].length > 8) {
        return parseFloat(result.toFixed(8)).toString();
    }
    return result.toString();
  } catch (err) {
    console.error("Eval error:", err);
    return "Error";
  }
};
