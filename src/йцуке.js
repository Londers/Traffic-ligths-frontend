var modever;
var currentPhase;
window.onload = function () {
    modever = 0;
    currentPhase = 0;
    setVisualMode(modever);
    dropLight();
    dropDirect();
    dropLocale();
};

function dropLocale() {
    var pr = document.getElementById('ПР');
    pr.setAttribute('visibility', 'hidden');
    var zm = document.getElementById('ЖМ');
    zm.setAttribute('visibility', 'hidden');
    var os = document.getElementById('ОС');
    os.setAttribute('visibility', 'hidden');
    var kk = document.getElementById('КК');
    kk.setAttribute('visibility', 'hidden');
};

function hasCam() {
    return false;
};

function currentVisualMode() {
    return modever;
};

function setVisualMode(mode) {

    dropLight();
    dropDirect();
    dropLocale();
    if (mode == 0) {
        document.getElementById('camData').setAttribute('visibility', 'hidden');
        document.getElementById('lightData').setAttribute('visibility', 'visible');
        modever = 0;
    }
    if (mode == 1) {
        document.getElementById('camData').setAttribute('visibility', 'visible');
        document.getElementById('lightData').setAttribute('visibility', 'hidden');
        modever = 1;
    }
};

function dropLight() {
    var TL7789 = document.getElementById('TL778.9');
    TL7789.setAttribute('fill', 'gray');
    var TL77810 = document.getElementById('TL778.10');
    TL77810.setAttribute('fill', 'gray');
    var TL221909 = document.getElementById('TL22190.9');
    TL221909.setAttribute('fill', 'gray');
    var TL2219010 = document.getElementById('TL22190.10');
    TL2219010.setAttribute('fill', 'gray');
    var TL2219013 = document.getElementById('TL22190.13');
    TL2219013.setAttribute('fill', 'gray');
    var TL2219015 = document.getElementById('TL22190.15');
    TL2219015.setAttribute('fill', 'gray');
    var TL18420 = document.getElementById('TL1842.0');
    TL18420.setAttribute('fill', 'gray');
    var TL28813 = document.getElementById('TL288.13');
    TL28813.setAttribute('fill', 'gray');
    var TL28815 = document.getElementById('TL288.15');
    TL28815.setAttribute('fill', 'gray');
    var TL301065 = document.getElementById('TL30106.5');
    TL301065.setAttribute('fill', 'gray');
    var TL301068 = document.getElementById('TL30106.8');
    TL301068.setAttribute('fill', 'gray');
    var TL3010613 = document.getElementById('TL30106.13');
    TL3010613.setAttribute('fill', 'gray');
    var TL90404 = document.getElementById('TL9040.4');
    TL90404.setAttribute('fill', 'gray');
    var TL90409 = document.getElementById('TL9040.9');
    TL90409.setAttribute('fill', 'gray');
    var TL89420 = document.getElementById('TL8942.0');
    TL89420.setAttribute('fill', 'gray');
    var TL89425 = document.getElementById('TL8942.5');
    TL89425.setAttribute('fill', 'gray');
    var TL2264812 = document.getElementById('TL22648.12');
    TL2264812.setAttribute('fill', 'gray');
    var TL2264813 = document.getElementById('TL22648.13');
    TL2264813.setAttribute('fill', 'gray');
    var TL2264815 = document.getElementById('TL22648.15');
    TL2264815.setAttribute('fill', 'gray');
    var TL274460 = document.getElementById('TL27446.0');
    TL274460.setAttribute('fill', 'gray');
    var TL274465 = document.getElementById('TL27446.5');
    TL274465.setAttribute('fill', 'gray');
    var TL238058 = document.getElementById('TL23805.8');
    TL238058.setAttribute('fill', 'gray');
    var TL158905 = document.getElementById('TL15890.5');
    TL158905.setAttribute('fill', 'gray');
    var TL158909 = document.getElementById('TL15890.9');
    TL158909.setAttribute('fill', 'gray');
    var TL1589013 = document.getElementById('TL15890.13');
    TL1589013.setAttribute('fill', 'gray');
    var TL1589015 = document.getElementById('TL15890.15');
    TL1589015.setAttribute('fill', 'gray');
    var TL67294 = document.getElementById('TL6729.4');
    TL67294.setAttribute('fill', 'gray');
    var TL67299 = document.getElementById('TL6729.9');
    TL67299.setAttribute('fill', 'gray');
    var TRTL313164 = document.getElementById('TRTL31316.4');
    TRTL313164.setAttribute('fill', 'gray');
    var TRTL313165 = document.getElementById('TRTL31316.5');
    TRTL313165.setAttribute('fill', 'gray');
    var TRTL313166 = document.getElementById('TRTL31316.6');
    TRTL313166.setAttribute('fill', 'gray');
    var TRTL313167 = document.getElementById('TRTL31316.7');
    TRTL313167.setAttribute('fill', 'gray');
    var TRTL3131612 = document.getElementById('TRTL31316.12');
    TRTL3131612.setAttribute('fill', 'gray');
    var TRTL3131613 = document.getElementById('TRTL31316.13');
    TRTL3131613.setAttribute('fill', 'gray');
    var TRTL3131614 = document.getElementById('TRTL31316.14');
    TRTL3131614.setAttribute('fill', 'gray');
    var TRTL3131615 = document.getElementById('TRTL31316.15');
    TRTL3131615.setAttribute('fill', 'gray');
};

function dropDirect() {
    var D3 = document.getElementById('D3');
    D3.setAttribute('visibility', 'hidden');
    var D3S = document.getElementById('D3S');
    D3S.setAttribute('visibility', 'hidden');
    var D4 = document.getElementById('D4');
    D4.setAttribute('visibility', 'hidden');
    var D4S = document.getElementById('D4S');
    D4S.setAttribute('visibility', 'hidden');
    var D5 = document.getElementById('D5');
    D5.setAttribute('visibility', 'hidden');
    var D5S = document.getElementById('D5S');
    D5S.setAttribute('visibility', 'hidden');
    var D6 = document.getElementById('D6');
    D6.setAttribute('visibility', 'hidden');
    var D6S = document.getElementById('D6S');
    D6S.setAttribute('visibility', 'hidden');
    var D7 = document.getElementById('D7');
    D7.setAttribute('visibility', 'hidden');
    var D7S = document.getElementById('D7S');
    D7S.setAttribute('visibility', 'hidden');
    var D8 = document.getElementById('D8');
    D8.setAttribute('visibility', 'hidden');
    var D8S = document.getElementById('D8S');
    D8S.setAttribute('visibility', 'hidden');
    var D9 = document.getElementById('D9');
    D9.setAttribute('visibility', 'hidden');
    var D9S = document.getElementById('D9S');
    D9S.setAttribute('visibility', 'hidden');
    var D10 = document.getElementById('D10');
    D10.setAttribute('visibility', 'hidden');
    var D10S = document.getElementById('D10S');
    D10S.setAttribute('visibility', 'hidden');
    var D11 = document.getElementById('D11');
    D11.setAttribute('visibility', 'hidden');
    var D11S = document.getElementById('D11S');
    D11S.setAttribute('visibility', 'hidden');
    var D12 = document.getElementById('D12');
    D12.setAttribute('visibility', 'hidden');
    var D12S = document.getElementById('D12S');
    D12S.setAttribute('visibility', 'hidden');
    var D13 = document.getElementById('D13');
    D13.setAttribute('visibility', 'hidden');
    var D13S = document.getElementById('D13S');
    D13S.setAttribute('visibility', 'hidden');
    var D14 = document.getElementById('D14');
    D14.setAttribute('visibility', 'hidden');
    var D14S = document.getElementById('D14S');
    D14S.setAttribute('visibility', 'hidden');
    var D15 = document.getElementById('D15');
    D15.setAttribute('visibility', 'hidden');
    var D15S = document.getElementById('D15S');
    D15S.setAttribute('visibility', 'hidden');
    var D16 = document.getElementById('D16');
    D16.setAttribute('visibility', 'hidden');
    var D16S = document.getElementById('D16S');
    D16S.setAttribute('visibility', 'hidden');
    var D17 = document.getElementById('D17');
    D17.setAttribute('visibility', 'hidden');
    var D17S = document.getElementById('D17S');
    D17S.setAttribute('visibility', 'hidden');
    var D18 = document.getElementById('D18');
    D18.setAttribute('visibility', 'hidden');
    var D19 = document.getElementById('D19');
    D19.setAttribute('visibility', 'hidden');
    var D20 = document.getElementById('D20');
    D20.setAttribute('visibility', 'hidden');
    var D21 = document.getElementById('D21');
    D21.setAttribute('visibility', 'hidden');
    var D23 = document.getElementById('D23');
    D23.setAttribute('visibility', 'hidden');
};

function setPhase(phase) {
    if (modever == 0) {
        if (phase == 0) {
            dropLight();
            dropDirect();
            dropLocale();
        }
        if (phase == 1) {
            dropLight();
            dropDirect();
            dropLocale();
            setStateD4('#008000');
            setStateD5('#008000');
            setStateD8('#008000');
            setStateD9('#008000');
            setStateD19('#008000');
            setStateD3('#ff0000');
            setStateD6('#ff0000');
            setStateD7('#ff0000');
            setStateD10('#ff0000');
            setStateD11('#ff0000');
            setStateD12('#ff0000');
            setStateD13('#ff0000');
            setStateD14('#ff0000');
            setStateD15('#ff0000');
            setStateD18('#ff0000');
            setStateD20('#ff0000');
            setStateD21('#ff0000');
            setStateD22('#ff0000');
            setStateD23('#ff0000');
            setStateD1('white');
            setStateD2('#9d9da3');
        }
        if (phase == 2) {
            dropLight();
            dropDirect();
            dropLocale();
            setStateD6('#008000');
            setStateD7('#008000');
            setStateD12('#008000');
            setStateD13('#008000');
            setStateD14('#008000');
            setStateD15('#008000');
            setStateD23('#008000');
            setStateD3('#ff0000');
            setStateD4('#ff0000');
            setStateD5('#ff0000');
            setStateD8('#ff0000');
            setStateD9('#ff0000');
            setStateD10('#ff0000');
            setStateD11('#ff0000');
            setStateD18('#ff0000');
            setStateD19('#ff0000');
            setStateD20('#ff0000');
            setStateD21('#ff0000');
            setStateD22('#ff0000');
            setStateD1('#9d9da3');
            setStateD2('#9d9da3');
        }
        if (phase == 3) {
            dropLight();
            dropDirect();
            dropLocale();
            setStateD6('#008000');
            setStateD7('#008000');
            setStateD10('#008000');
            setStateD11('#008000');
            setStateD20('#008000');
            setStateD21('#008000');
            setStateD23('#008000');
            setStateD3('#ff0000');
            setStateD4('#ff0000');
            setStateD5('#ff0000');
            setStateD8('#ff0000');
            setStateD9('#ff0000');
            setStateD12('#ff0000');
            setStateD13('#ff0000');
            setStateD14('#ff0000');
            setStateD15('#ff0000');
            setStateD18('#ff0000');
            setStateD19('#ff0000');
            setStateD22('#ff0000');
            setStateD1('white');
            setStateD2('white');
        }
        if (phase == 4) {
            dropLight();
            dropDirect();
            dropLocale();
            setStateD3('#008000');
            setStateD12('#008000');
            setStateD16('#008000');
            setStateD17('#008000');
            setStateD18('#008000');
            setStateD23('#008000');
            setStateD4('#ff0000');
            setStateD5('#ff0000');
            setStateD6('#ff0000');
            setStateD7('#ff0000');
            setStateD8('#ff0000');
            setStateD9('#ff0000');
            setStateD10('#ff0000');
            setStateD11('#ff0000');
            setStateD13('#ff0000');
            setStateD14('#ff0000');
            setStateD15('#ff0000');
            setStateD19('#ff0000');
            setStateD20('#ff0000');
            setStateD21('#ff0000');
            setStateD22('#ff0000');
            setStateD1('white');
            setStateD2('#9d9da3');
        }
        if (phase == 9) {
            dropLocale();
            var pr = document.getElementById('ПР');
            pr.setAttribute('visibility', 'visible');
        }
        if (phase == 10) {
            dropLight();
            dropDirect();
            dropLocale();
            var zm = document.getElementById('ЖМ');
            zm.setAttribute('visibility', 'visible');
            setStateD1('#000000');
            setStateD2('#000000');
            setStateD3('#000000');
            setStateD4('#000000');
            setStateD5('#000000');
            setStateD6('#000000');
            setStateD7('#000000');
            setStateD8('#000000');
            setStateD9('#000000');
            setStateD10('#000000');
            setStateD11('#000000');
            setStateD12('#000000');
            setStateD13('#000000');
            setStateD14('#000000');
            setStateD15('#000000');
            setStateD16('#000000');
            setStateD17('#000000');
            setStateD18('#000000');
            setStateD19('#000000');
            setStateD20('#000000');
            setStateD21('#000000');
            setStateD22('#000000');
            setStateD23('#000000');
        }
        if (phase == 11) {
            dropLight();
            dropDirect();
            dropLocale();
            var os = document.getElementById('ОС');
            os.setAttribute('visibility', 'visible');
            setStateD1('#a0a0a4');
            setStateD2('#a0a0a4');
            setStateD3('#a0a0a4');
            setStateD4('#a0a0a4');
            setStateD5('#a0a0a4');
            setStateD6('#a0a0a4');
            setStateD7('#a0a0a4');
            setStateD8('#a0a0a4');
            setStateD9('#a0a0a4');
            setStateD10('#a0a0a4');
            setStateD11('#a0a0a4');
            setStateD12('#a0a0a4');
            setStateD13('#a0a0a4');
            setStateD14('#a0a0a4');
            setStateD15('#a0a0a4');
            setStateD16('#a0a0a4');
            setStateD17('#a0a0a4');
            setStateD18('#a0a0a4');
            setStateD19('#a0a0a4');
            setStateD20('#a0a0a4');
            setStateD21('#a0a0a4');
            setStateD22('#a0a0a4');
            setStateD23('#a0a0a4');
        }
        if (phase == 12) {
            dropLight();
            dropDirect();
            dropLocale();
            var kk = document.getElementById('КК');
            kk.setAttribute('visibility', 'visible');
            setStateD1('#0000ff');
            setStateD2('#0000ff');
            setStateD3('#0000ff');
            setStateD4('#0000ff');
            setStateD5('#0000ff');
            setStateD6('#0000ff');
            setStateD7('#0000ff');
            setStateD8('#0000ff');
            setStateD9('#0000ff');
            setStateD10('#0000ff');
            setStateD11('#0000ff');
            setStateD12('#0000ff');
            setStateD13('#0000ff');
            setStateD14('#0000ff');
            setStateD15('#0000ff');
            setStateD16('#0000ff');
            setStateD17('#0000ff');
            setStateD18('#0000ff');
            setStateD19('#0000ff');
            setStateD20('#0000ff');
            setStateD21('#0000ff');
            setStateD22('#0000ff');
            setStateD23('#0000ff');
        }
    }
};

function setStateD1(color) {
    if (color == '#008000') {
    }
    if (color == '#9d9da3') {
        var TRTL3131612 = document.getElementById('TRTL31316.12');
        TRTL3131612.setAttribute('fill', color);
        var TRTL3131613 = document.getElementById('TRTL31316.13');
        TRTL3131613.setAttribute('fill', color);
        var TRTL3131614 = document.getElementById('TRTL31316.14');
        TRTL3131614.setAttribute('fill', color);
    }
    if (color == 'white') {
        var TRTL3131612 = document.getElementById('TRTL31316.12');
        TRTL3131612.setAttribute('fill', color);
        var TRTL3131613 = document.getElementById('TRTL31316.13');
        TRTL3131613.setAttribute('fill', color);
        var TRTL3131614 = document.getElementById('TRTL31316.14');
        TRTL3131614.setAttribute('fill', color);
    }
    if (color == '#ff0000') {
    }
    if (color == '#000000') {
        var TRTL3131612 = document.getElementById('TRTL31316.12');
        TRTL3131612.setAttribute('fill', 'gray');
        var TRTL3131613 = document.getElementById('TRTL31316.13');
        TRTL3131613.setAttribute('fill', 'gray');
        var TRTL3131614 = document.getElementById('TRTL31316.14');
        TRTL3131614.setAttribute('fill', 'gray');
    }
    if (color == '#0000ff') {
        var TRTL3131612 = document.getElementById('TRTL31316.12');
        TRTL3131612.setAttribute('fill', 'gray');
        var TRTL3131613 = document.getElementById('TRTL31316.13');
        TRTL3131613.setAttribute('fill', 'gray');
        var TRTL3131614 = document.getElementById('TRTL31316.14');
        TRTL3131614.setAttribute('fill', 'gray');
    }
    if (color == '#a0a0a4') {
        var TRTL3131612 = document.getElementById('TRTL31316.12');
        TRTL3131612.setAttribute('fill', 'gray');
        var TRTL3131613 = document.getElementById('TRTL31316.13');
        TRTL3131613.setAttribute('fill', 'gray');
        var TRTL3131614 = document.getElementById('TRTL31316.14');
        TRTL3131614.setAttribute('fill', 'gray');
    }
};

function setStateD2(color) {
    if (color == '#008000') {
    }
    if (color == '#9d9da3') {
        var TRTL313164 = document.getElementById('TRTL31316.4');
        TRTL313164.setAttribute('fill', color);
        var TRTL313165 = document.getElementById('TRTL31316.5');
        TRTL313165.setAttribute('fill', color);
        var TRTL313166 = document.getElementById('TRTL31316.6');
        TRTL313166.setAttribute('fill', color);
    }
    if (color == 'white') {
        var TRTL313164 = document.getElementById('TRTL31316.4');
        TRTL313164.setAttribute('fill', color);
        var TRTL313165 = document.getElementById('TRTL31316.5');
        TRTL313165.setAttribute('fill', color);
        var TRTL313166 = document.getElementById('TRTL31316.6');
        TRTL313166.setAttribute('fill', color);
    }
    if (color == '#ff0000') {
    }
    if (color == '#000000') {
        var TRTL313164 = document.getElementById('TRTL31316.4');
        TRTL313164.setAttribute('fill', 'gray');
        var TRTL313165 = document.getElementById('TRTL31316.5');
        TRTL313165.setAttribute('fill', 'gray');
        var TRTL313166 = document.getElementById('TRTL31316.6');
        TRTL313166.setAttribute('fill', 'gray');
    }
    if (color == '#0000ff') {
        var TRTL313164 = document.getElementById('TRTL31316.4');
        TRTL313164.setAttribute('fill', 'gray');
        var TRTL313165 = document.getElementById('TRTL31316.5');
        TRTL313165.setAttribute('fill', 'gray');
        var TRTL313166 = document.getElementById('TRTL31316.6');
        TRTL313166.setAttribute('fill', 'gray');
    }
    if (color == '#a0a0a4') {
        var TRTL313164 = document.getElementById('TRTL31316.4');
        TRTL313164.setAttribute('fill', 'gray');
        var TRTL313165 = document.getElementById('TRTL31316.5');
        TRTL313165.setAttribute('fill', 'gray');
        var TRTL313166 = document.getElementById('TRTL31316.6');
        TRTL313166.setAttribute('fill', 'gray');
    }
};

function setStateD3(color) {
    if (color == '#008000') {
        var D3 = document.getElementById('D3');
        D3.setAttribute('visibility', 'visible');
        var TL1589015 = document.getElementById('TL15890.15');
        TL1589015.setAttribute('fill', color);
        var TL2264815 = document.getElementById('TL22648.15');
        TL2264815.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D3 = document.getElementById('D3');
        D3.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D3 = document.getElementById('D3');
        D3.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D3S = document.getElementById('D3S');
        D3S.setAttribute('visibility', 'visible');
        var TL1589015 = document.getElementById('TL15890.15');
        TL1589015.setAttribute('fill', color);
        var TL2264815 = document.getElementById('TL22648.15');
        TL2264815.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL1589015 = document.getElementById('TL15890.15');
        TL1589015.setAttribute('fill', '#FFFF00');
        var TL2264815 = document.getElementById('TL22648.15');
        TL2264815.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL1589015 = document.getElementById('TL15890.15');
        TL1589015.setAttribute('fill', '#ff0000');
        var TL2264815 = document.getElementById('TL22648.15');
        TL2264815.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL1589015 = document.getElementById('TL15890.15');
        TL1589015.setAttribute('fill', color);
        var TL2264815 = document.getElementById('TL22648.15');
        TL2264815.setAttribute('fill', color);
    }
};

function setStateD4(color) {
    if (color == '#008000') {
        var D4 = document.getElementById('D4');
        D4.setAttribute('visibility', 'visible');
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', color);
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D4 = document.getElementById('D4');
        D4.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D4 = document.getElementById('D4');
        D4.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D4S = document.getElementById('D4S');
        D4S.setAttribute('visibility', 'visible');
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', color);
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', '#FFFF00');
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', '#ff0000');
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', color);
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', color);
    }
};

function setStateD5(color) {
    if (color == '#008000') {
        var D5 = document.getElementById('D5');
        D5.setAttribute('visibility', 'visible');
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', color);
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D5 = document.getElementById('D5');
        D5.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D5 = document.getElementById('D5');
        D5.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D5S = document.getElementById('D5S');
        D5S.setAttribute('visibility', 'visible');
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', color);
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', '#FFFF00');
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', '#ff0000');
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL274465 = document.getElementById('TL27446.5');
        TL274465.setAttribute('fill', color);
        var TL158905 = document.getElementById('TL15890.5');
        TL158905.setAttribute('fill', color);
    }
};

function setStateD6(color) {
    if (color == '#008000') {
        var D6 = document.getElementById('D6');
        D6.setAttribute('visibility', 'visible');
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', color);
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D6 = document.getElementById('D6');
        D6.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D6 = document.getElementById('D6');
        D6.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D6S = document.getElementById('D6S');
        D6S.setAttribute('visibility', 'visible');
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', color);
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', '#FFFF00');
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', '#ff0000');
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', color);
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', color);
    }
};

function setStateD7(color) {
    if (color == '#008000') {
        var D7 = document.getElementById('D7');
        D7.setAttribute('visibility', 'visible');
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', color);
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D7 = document.getElementById('D7');
        D7.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D7 = document.getElementById('D7');
        D7.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D7S = document.getElementById('D7S');
        D7S.setAttribute('visibility', 'visible');
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', color);
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', '#FFFF00');
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', '#ff0000');
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL67299 = document.getElementById('TL6729.9');
        TL67299.setAttribute('fill', color);
        var TL158909 = document.getElementById('TL15890.9');
        TL158909.setAttribute('fill', color);
    }
};

function setStateD8(color) {
    if (color == '#008000') {
        var D8 = document.getElementById('D8');
        D8.setAttribute('visibility', 'visible');
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', color);
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D8 = document.getElementById('D8');
        D8.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D8 = document.getElementById('D8');
        D8.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D8S = document.getElementById('D8S');
        D8S.setAttribute('visibility', 'visible');
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', color);
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', '#FFFF00');
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', '#ff0000');
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', color);
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', color);
    }
};

function setStateD9(color) {
    if (color == '#008000') {
        var D9 = document.getElementById('D9');
        D9.setAttribute('visibility', 'visible');
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', color);
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D9 = document.getElementById('D9');
        D9.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D9 = document.getElementById('D9');
        D9.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D9S = document.getElementById('D9S');
        D9S.setAttribute('visibility', 'visible');
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', color);
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', '#FFFF00');
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', '#ff0000');
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL301065 = document.getElementById('TL30106.5');
        TL301065.setAttribute('fill', color);
        var TL89425 = document.getElementById('TL8942.5');
        TL89425.setAttribute('fill', color);
    }
};

function setStateD10(color) {
    if (color == '#008000') {
        var D10 = document.getElementById('D10');
        D10.setAttribute('visibility', 'visible');
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', color);
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D10 = document.getElementById('D10');
        D10.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D10 = document.getElementById('D10');
        D10.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D10S = document.getElementById('D10S');
        D10S.setAttribute('visibility', 'visible');
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', color);
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', '#FFFF00');
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', '#ff0000');
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', color);
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', color);
    }
};

function setStateD11(color) {
    if (color == '#008000') {
        var D11 = document.getElementById('D11');
        D11.setAttribute('visibility', 'visible');
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', color);
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D11 = document.getElementById('D11');
        D11.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D11 = document.getElementById('D11');
        D11.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D11S = document.getElementById('D11S');
        D11S.setAttribute('visibility', 'visible');
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', color);
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', '#FFFF00');
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', '#ff0000');
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL221909 = document.getElementById('TL22190.9');
        TL221909.setAttribute('fill', color);
        var TL7789 = document.getElementById('TL778.9');
        TL7789.setAttribute('fill', color);
    }
};

function setStateD12(color) {
    if (color == '#008000') {
        var D12 = document.getElementById('D12');
        D12.setAttribute('visibility', 'visible');
        var TL77810 = document.getElementById('TL778.10');
        TL77810.setAttribute('fill', color);
        var TL2219010 = document.getElementById('TL22190.10');
        TL2219010.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D12 = document.getElementById('D12');
        D12.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D12 = document.getElementById('D12');
        D12.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D12S = document.getElementById('D12S');
        D12S.setAttribute('visibility', 'visible');
        var TL77810 = document.getElementById('TL778.10');
        TL77810.setAttribute('fill', color);
        var TL2219010 = document.getElementById('TL22190.10');
        TL2219010.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL77810 = document.getElementById('TL778.10');
        TL77810.setAttribute('fill', '#FFFF00');
        var TL2219010 = document.getElementById('TL22190.10');
        TL2219010.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL77810 = document.getElementById('TL778.10');
        TL77810.setAttribute('fill', '#ff0000');
        var TL2219010 = document.getElementById('TL22190.10');
        TL2219010.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL77810 = document.getElementById('TL778.10');
        TL77810.setAttribute('fill', color);
        var TL2219010 = document.getElementById('TL22190.10');
        TL2219010.setAttribute('fill', color);
    }
};

function setStateD13(color) {
    if (color == '#008000') {
        var D13 = document.getElementById('D13');
        D13.setAttribute('visibility', 'visible');
        var TL28815 = document.getElementById('TL288.15');
        TL28815.setAttribute('fill', color);
        var TL2219015 = document.getElementById('TL22190.15');
        TL2219015.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D13 = document.getElementById('D13');
        D13.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D13 = document.getElementById('D13');
        D13.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D13S = document.getElementById('D13S');
        D13S.setAttribute('visibility', 'visible');
        var TL28815 = document.getElementById('TL288.15');
        TL28815.setAttribute('fill', color);
        var TL2219015 = document.getElementById('TL22190.15');
        TL2219015.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL28815 = document.getElementById('TL288.15');
        TL28815.setAttribute('fill', '#FFFF00');
        var TL2219015 = document.getElementById('TL22190.15');
        TL2219015.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL28815 = document.getElementById('TL288.15');
        TL28815.setAttribute('fill', '#ff0000');
        var TL2219015 = document.getElementById('TL22190.15');
        TL2219015.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL28815 = document.getElementById('TL288.15');
        TL28815.setAttribute('fill', color);
        var TL2219015 = document.getElementById('TL22190.15');
        TL2219015.setAttribute('fill', color);
    }
};

function setStateD14(color) {
    if (color == '#008000') {
        var D14 = document.getElementById('D14');
        D14.setAttribute('visibility', 'visible');
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', color);
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D14 = document.getElementById('D14');
        D14.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D14 = document.getElementById('D14');
        D14.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D14S = document.getElementById('D14S');
        D14S.setAttribute('visibility', 'visible');
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', color);
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', '#FFFF00');
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', '#ff0000');
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', color);
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', color);
    }
};

function setStateD15(color) {
    if (color == '#008000') {
        var D15 = document.getElementById('D15');
        D15.setAttribute('visibility', 'visible');
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', color);
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D15 = document.getElementById('D15');
        D15.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D15 = document.getElementById('D15');
        D15.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D15S = document.getElementById('D15S');
        D15S.setAttribute('visibility', 'visible');
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', color);
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', '#FFFF00');
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', '#ff0000');
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL90409 = document.getElementById('TL9040.9');
        TL90409.setAttribute('fill', color);
        var TL3010613 = document.getElementById('TL30106.13');
        TL3010613.setAttribute('fill', color);
    }
};

function setStateD16(color) {
    if (color == '#008000') {
        var D16 = document.getElementById('D16');
        D16.setAttribute('visibility', 'visible');
    }
    if (color == '#9d9da3') {
        var D16 = document.getElementById('D16');
        D16.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D16 = document.getElementById('D16');
        D16.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D16S = document.getElementById('D16S');
        D16S.setAttribute('visibility', 'visible');
    }
    if (color == '#000000') {
    }
    if (color == '#0000ff') {
    }
    if (color == '#a0a0a4') {
    }
};

function setStateD17(color) {
    if (color == '#008000') {
        var D17 = document.getElementById('D17');
        D17.setAttribute('visibility', 'visible');
    }
    if (color == '#9d9da3') {
        var D17 = document.getElementById('D17');
        D17.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D17 = document.getElementById('D17');
        D17.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var D17S = document.getElementById('D17S');
        D17S.setAttribute('visibility', 'visible');
    }
    if (color == '#000000') {
    }
    if (color == '#0000ff') {
    }
    if (color == '#a0a0a4') {
    }
};

function setStateD18(color) {
    if (color == '#008000') {
        var D18 = document.getElementById('D18');
        D18.setAttribute('visibility', 'visible');
        var TL238058 = document.getElementById('TL23805.8');
        TL238058.setAttribute('fill', color);
        var TL274460 = document.getElementById('TL27446.0');
        TL274460.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D18 = document.getElementById('D18');
        D18.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D18 = document.getElementById('D18');
        D18.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var TL238058 = document.getElementById('TL23805.8');
        TL238058.setAttribute('fill', color);
        var TL274460 = document.getElementById('TL27446.0');
        TL274460.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL238058 = document.getElementById('TL23805.8');
        TL238058.setAttribute('fill', '#a0a0a4');
        var TL274460 = document.getElementById('TL27446.0');
        TL274460.setAttribute('fill', '#a0a0a4');
    }
    if (color == '#0000ff') {
        var TL238058 = document.getElementById('TL23805.8');
        TL238058.setAttribute('fill', '#ff0000');
        var TL274460 = document.getElementById('TL27446.0');
        TL274460.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL238058 = document.getElementById('TL23805.8');
        TL238058.setAttribute('fill', color);
        var TL274460 = document.getElementById('TL27446.0');
        TL274460.setAttribute('fill', color);
    }
};

function setStateD19(color) {
    if (color == '#008000') {
        var D19 = document.getElementById('D19');
        D19.setAttribute('visibility', 'visible');
        var TL2264812 = document.getElementById('TL22648.12');
        TL2264812.setAttribute('fill', color);
        var TL67294 = document.getElementById('TL6729.4');
        TL67294.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D19 = document.getElementById('D19');
        D19.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D19 = document.getElementById('D19');
        D19.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var TL2264812 = document.getElementById('TL22648.12');
        TL2264812.setAttribute('fill', color);
        var TL67294 = document.getElementById('TL6729.4');
        TL67294.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL2264812 = document.getElementById('TL22648.12');
        TL2264812.setAttribute('fill', '#a0a0a4');
        var TL67294 = document.getElementById('TL6729.4');
        TL67294.setAttribute('fill', '#a0a0a4');
    }
    if (color == '#0000ff') {
        var TL2264812 = document.getElementById('TL22648.12');
        TL2264812.setAttribute('fill', '#ff0000');
        var TL67294 = document.getElementById('TL6729.4');
        TL67294.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL2264812 = document.getElementById('TL22648.12');
        TL2264812.setAttribute('fill', color);
        var TL67294 = document.getElementById('TL6729.4');
        TL67294.setAttribute('fill', color);
    }
};

function setStateD20(color) {
    if (color == '#008000') {
        var D20 = document.getElementById('D20');
        D20.setAttribute('visibility', 'visible');
        var TL301068 = document.getElementById('TL30106.8');
        TL301068.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D20 = document.getElementById('D20');
        D20.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D20 = document.getElementById('D20');
        D20.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var TL301068 = document.getElementById('TL30106.8');
        TL301068.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL301068 = document.getElementById('TL30106.8');
        TL301068.setAttribute('fill', '#a0a0a4');
    }
    if (color == '#0000ff') {
        var TL301068 = document.getElementById('TL30106.8');
        TL301068.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL301068 = document.getElementById('TL30106.8');
        TL301068.setAttribute('fill', color);
    }
};

function setStateD21(color) {
    if (color == '#008000') {
        var D21 = document.getElementById('D21');
        D21.setAttribute('visibility', 'visible');
        var TL18420 = document.getElementById('TL1842.0');
        TL18420.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D21 = document.getElementById('D21');
        D21.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D21 = document.getElementById('D21');
        D21.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var TL18420 = document.getElementById('TL1842.0');
        TL18420.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL18420 = document.getElementById('TL1842.0');
        TL18420.setAttribute('fill', '#a0a0a4');
    }
    if (color == '#0000ff') {
        var TL18420 = document.getElementById('TL1842.0');
        TL18420.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL18420 = document.getElementById('TL1842.0');
        TL18420.setAttribute('fill', color);
    }
};

function setStateD22(color) {
    if (color == '#008000') {
        var TL2219013 = document.getElementById('TL22190.13');
        TL2219013.setAttribute('fill', color);
        var TL28813 = document.getElementById('TL288.13');
        TL28813.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
    }
    if (color == 'white') {
    }
    if (color == '#ff0000') {
        var TL2219013 = document.getElementById('TL22190.13');
        TL2219013.setAttribute('fill', color);
        var TL28813 = document.getElementById('TL288.13');
        TL28813.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL2219013 = document.getElementById('TL22190.13');
        TL2219013.setAttribute('fill', '#FFFF00');
        var TL28813 = document.getElementById('TL288.13');
        TL28813.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL2219013 = document.getElementById('TL22190.13');
        TL2219013.setAttribute('fill', '#ff0000');
        var TL28813 = document.getElementById('TL288.13');
        TL28813.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL2219013 = document.getElementById('TL22190.13');
        TL2219013.setAttribute('fill', color);
        var TL28813 = document.getElementById('TL288.13');
        TL28813.setAttribute('fill', color);
    }
};

function setStateD23(color) {
    if (color == '#008000') {
        var D23 = document.getElementById('D23');
        D23.setAttribute('visibility', 'visible');
        var TL90404 = document.getElementById('TL9040.4');
        TL90404.setAttribute('fill', color);
        var TL89420 = document.getElementById('TL8942.0');
        TL89420.setAttribute('fill', color);
    }
    if (color == '#9d9da3') {
        var D23 = document.getElementById('D23');
        D23.setAttribute('visibility', 'visible');
    }
    if (color == 'white') {
        var D23 = document.getElementById('D23');
        D23.setAttribute('visibility', 'hidden');
    }
    if (color == '#ff0000') {
        var TL90404 = document.getElementById('TL9040.4');
        TL90404.setAttribute('fill', color);
        var TL89420 = document.getElementById('TL8942.0');
        TL89420.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL90404 = document.getElementById('TL9040.4');
        TL90404.setAttribute('fill', '#a0a0a4');
        var TL89420 = document.getElementById('TL8942.0');
        TL89420.setAttribute('fill', '#a0a0a4');
    }
    if (color == '#0000ff') {
        var TL90404 = document.getElementById('TL9040.4');
        TL90404.setAttribute('fill', '#ff0000');
        var TL89420 = document.getElementById('TL8942.0');
        TL89420.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL90404 = document.getElementById('TL9040.4');
        TL90404.setAttribute('fill', color);
        var TL89420 = document.getElementById('TL8942.0');
        TL89420.setAttribute('fill', color);
    }
};

function getPhasesMass() {
    var mass = [
        {
            phase: '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',
            num: '1'
        },
        {
            phase: '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',
            num: '2'
        },
        {
            phase: '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',
            num: '3'
        },
        {
            phase: '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',
            num: '4'
        }
    ];
    return mass;
};

function getAnglesCamera() {
    return [];
};
