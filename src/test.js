let currentPhase;
window.onload = function () {
    currentPhase = 0;
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

function dropLight() {
    var TL4919 = document.getElementById('TL491.9');
    TL4919.setAttribute('fill', 'white');
    var TL29951 = document.getElementById('TL2995.1');
    TL29951.setAttribute('fill', 'white');
};

function dropDirect() {
    var D1 = document.getElementById('D1');
    D1.setAttribute('visibility', 'hidden');
    var D1S = document.getElementById('D1S');
    D1S.setAttribute('visibility', 'hidden');
    var D2 = document.getElementById('D2');
    D2.setAttribute('visibility', 'hidden');
    var D2S = document.getElementById('D2S');
    D2S.setAttribute('visibility', 'hidden');
};

function setPhase(phase) {
    if (phase == 1) {
        dropLight();
        dropDirect();
        dropLocale();
        setStateD1('#008000');
        setStateD2('#ff0000');
    }
    if (phase == 2) {
        dropLight();
        dropDirect();
        dropLocale();
        setStateD2('#008000');
        setStateD1('#ff0000');
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
    }
    if (phase == 11) {
        dropLight();
        dropDirect();
        dropLocale();
        var os = document.getElementById('ОС');
        os.setAttribute('visibility', 'visible');
        setStateD1('#a0a0a4');
        setStateD2('#a0a0a4');
    }
    if (phase == 12) {
        dropLight();
        dropDirect();
        dropLocale();
        var kk = document.getElementById('КК');
        kk.setAttribute('visibility', 'visible');
        setStateD1('#0000ff');
        setStateD2('#0000ff');
    }
};

function setStateD1(color) {
    if (color == '#008000') {
        var D1 = document.getElementById('D1');
        D1.setAttribute('visibility', 'visible');
        var TL29951 = document.getElementById('TL2995.1');
        TL29951.setAttribute('fill', color);
    }
    if (color == '#ff0000') {
        var D1S = document.getElementById('D1S');
        D1S.setAttribute('visibility', 'visible');
        var TL29951 = document.getElementById('TL2995.1');
        TL29951.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL29951 = document.getElementById('TL2995.1');
        TL29951.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL29951 = document.getElementById('TL2995.1');
        TL29951.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL29951 = document.getElementById('TL2995.1');
        TL29951.setAttribute('fill', color);
    }
};

function setStateD2(color) {
    if (color == '#008000') {
        var D2 = document.getElementById('D2');
        D2.setAttribute('visibility', 'visible');
        var TL4919 = document.getElementById('TL491.9');
        TL4919.setAttribute('fill', color);
    }
    if (color == '#ff0000') {
        var D2S = document.getElementById('D2S');
        D2S.setAttribute('visibility', 'visible');
        var TL4919 = document.getElementById('TL491.9');
        TL4919.setAttribute('fill', color);
    }
    if (color == '#000000') {
        var TL4919 = document.getElementById('TL491.9');
        TL4919.setAttribute('fill', '#FFFF00');
    }
    if (color == '#0000ff') {
        var TL4919 = document.getElementById('TL491.9');
        TL4919.setAttribute('fill', '#ff0000');
    }
    if (color == '#a0a0a4') {
        var TL4919 = document.getElementById('TL491.9');
        TL4919.setAttribute('fill', color);
    }
};

function getPhasesMass() {
    var mass = [{
        phase: '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',
        num: '1'
    },
        {
            phase: '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',
            num: '2'
        }];
    return mass;
};

