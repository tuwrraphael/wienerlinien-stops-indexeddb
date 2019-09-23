export function* splitCsvLine(str, symbol) {
    let splitted = str.split(symbol);
    let accumulate = "";
    for (let s of splitted) {
        s = accumulate + s;
        if (s[0] == "\"") {
            if (s[s.length - 1] == "\"" && (s.length <= 2 || s[s.length - 2] != "\"")) {
                yield s.substring(1, s.length - 1);
                accumulate = "";
            }
            else {
                accumulate += s;
            }
        } else {
            yield s;
            accumulate = "";
        }
    }
    if (accumulate.length) {
        yield accumulate;
    }
}