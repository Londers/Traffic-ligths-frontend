let dataSave;
let devices;
let IDs = [];
let regionInfo;
let areaInfo;
// 0 - технология, 1 - по устройству, 2 - двери+лампы
let type = 0;

let dateSave;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

$(function () {
    $('#table').bootstrapTable('showLoading');
    // Перевод на русский
    $('[class~=loading-text]').text('Загрузка. Пожалуйста, подождите');
    $('[class~=no-records-found] td').text('Записей не найдено');
    $('[class~=search]').each(({}, search) => {
        $(search).find('input').attr('placeholder', 'Поиск')
    });
    $.ajax({
        url: window.location.href,
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            regionInfo = Object.assign({}, data.regionInfo);
            areaInfo = Object.assign({}, data.areaInfo);
            devices = data.devices.slice();
            data.devices.forEach((device, counter) => {
                if (device.idevice !== -1) {
                    let region = regionInfo[devices[counter].region];
                    let area = areaInfo[region][devices[counter].area];
                    device.region = region;
                    device.area = area;
                    IDs.push({ID: device.ID, description: device.description});
                    devices[counter].ID = '';
                }
            });
            console.log(data);

            $('#table').bootstrapTable('hideLoading');
            $('#table')
                .bootstrapTable('removeAll')
                .bootstrapTable('append', data.devices)
                .bootstrapTable('scrollTo', 'top')
                .bootstrapTable('refresh', {
                    data: data.devices
                });

            let now = new Date();
            $('#dateEnd').attr('value', (now.toISOString().slice(0, 10)));
            $('#timeEnd').attr('value', (prettyNumbers(now.getHours()) + ':' + prettyNumbers(now.getMinutes())));
            now = new Date(
                now.getTime() - (
                    (((now.getHours() * 60 + now.getMinutes() + now.getTimezoneOffset()) * 60 + now.getSeconds()) * 1000)
                    + now.getMilliseconds()
                )
            );// ((24 * 60) * 60 * 1000)); // - (now.getTimezoneOffset() * 60 * 1000));
            $('#dateStart').attr('value', (now.toISOString().slice(0, 10)));
            $('#timeStart').attr('value', (prettyNumbers(now.getUTCHours()) + ':' + prettyNumbers(now.getUTCMinutes())));
            $('#currentDay').on('click', () => {
                now = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60 * 1000));
                let timeStart = $('#dateStart')[0].value + 'T' + $('#timeStart')[0].value + ':00Z';
                let timeEnd = now.toISOString();
                getLogs(timeStart, timeEnd, true);
            });

            $('#chosenTime').on('click', () => {
                // let now = new Date();
                // now = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
                let timeStart = $('#dateStart')[0].value + 'T' + $('#timeStart')[0].value + ':00Z';
                let timeEnd = $('#dateEnd')[0].value + 'T' + $('#timeEnd')[0].value + ':00Z';
                getLogs(timeStart, timeEnd, false);
            });

            $('#type').on('change', () => {
                type = Number($('#type').val());
                buildLogTable(undefined, true);
            });

            if (localStorage.getItem('jump') !== 'undefined') {
                $('input[class$="search-input"]:first').val(localStorage.getItem('jump')).trigger('blur');
                // sleep(500).then(() => $('#table').bootstrapTable('check', 0));
                localStorage.setItem('jump', undefined);
            }

            if (localStorage.getItem('region') !== 'undefined') {
                let now = new Date();
                now = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
                let timeStart = $('#dateStart')[0].value + 'T' + $('#timeStart')[0].value + ':00Z';
                let timeEnd = now.toISOString();
                getLogs(timeStart, timeEnd, true, true);
            }
        },
        // data: JSON.stringify(data.state),
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            alert(JSON.parse(request.responseText).message);
        }
    });
    // });
});

function getLogs(start, end, crutchFlag, remoteOpenFlag) {
    // {ID: '', area: '', region: ''}
    // console.log('start:' + start + '   end' + end);
    let toSend = {devices: [], timeStart: start, timeEnd: end};
    let selected = $('#table').bootstrapTable('getSelections');
    selected.forEach(cross => {
        toSend.devices.push({
            ID: findIdByDescription(cross.description),
            area: getAreaNum(cross.region, cross.area),
            region: getRegionNum(cross.region),
            description: cross.description
        });
    });

    if (!selected.length) {
        if (remoteOpenFlag) {
            toSend.devices.push({
                ID: Number(localStorage.getItem('ID')),
                area: localStorage.getItem('area'),
                region: localStorage.getItem('region'),
                description: localStorage.getItem('description')
            });
            console.log(start);
            localStorage.setItem('ID', undefined);
            localStorage.setItem('area', undefined);
            localStorage.setItem('region', undefined);
        } else {
            $('#toolbar0').append('<div style="color: red;" id="toolbar0Msg"><h5>Выберите устройства</h5></div>');
            return;
        }
    } else {
        $('#toolbar0Msg').remove();
    }

    $('#logsTable').bootstrapTable('showLoading');
    $('[class~=loading-text]').text('Загрузка. Пожалуйста, подождите');

    // Отправка на сервер запроса проверки данных
    $.ajax({
        type: 'POST',
        url: window.location.href + '/info',
        data: JSON.stringify(toSend),
        dataType: 'json',
        success: function (data) {
            dateSave = new Date();
            buildLogTable(data, crutchFlag);
            $('#logsTable').bootstrapTable('hideLoading');
            if (remoteOpenFlag) {
                $('input[class$="search-input"]:first').val(localStorage.getItem('description')).trigger('blur');
                sleep(500).then(() => $('#table').bootstrapTable('check', 0));
                localStorage.setItem('description', undefined);
            }
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            alert(JSON.parse(request.responseText).message);
        }
    });
    console.log(toSend);
}

function filterByType(data) {
    let filteredData = [];
    for (let dev in data.deviceLogs) {
        filteredData[dev] = [];
        if (data.deviceLogs[dev] == null) continue;
        data.deviceLogs[dev].forEach(log => {
            if (log.type === type) filteredData[dev].push(log);
        })
    }
    return filteredData;
}

function collapseDuplicates(data) {
    let collapsedData = [];
    for (let dev in data) {
        collapsedData[dev] = [];
        data[dev].forEach((log, index) => {
            if (index < (data[dev].length - 1)) {
                if (log.text !== data[dev][index + 1].text) {
                    collapsedData[dev].push(log);
                }
            } else {
                collapsedData[dev].push(log);
            }
        })
    }
    return collapsedData;
}

function buildLogTable(data, crutchFlag) {
    (data === undefined) ? data = dataSave : dataSave = data;

    let filteredData = collapseDuplicates(filterByType(data));

    let allData = new Array(filteredData.length);

    for (let dev in filteredData) {
        filteredData[dev].forEach((log, index) => {
            if (index === 0) {
                allData.push({
                    message: JSON.parse(dev).description
                });
            }
            let localPrevDate, duration;
            let date = new Date(log.time);

            if (index < filteredData[dev].length) {
                if ((crutchFlag) && (index === (filteredData[dev].length - 1))) {
                    date = new Date($('#dateStart')[0].value + 'T' + $('#timeStart')[0].value + ':00.00' + log.time.slice(-6));
                }
                let prevDate = (index === 0) ? dateSave : new Date(filteredData[dev][index - 1].time);
                localPrevDate = prevDate.toLocaleString('ru-RU');
                // duration = Math.floor(prevDate.getTime() - date.getTime()) + date.getTimezoneOffset() * 60 * 1000;// 1000);
                // let hours = new Date(duration).getHours();
                // let minutes = new Date(duration).getMinutes();
                // let seconds = new Date(duration).getSeconds();
                duration = (prevDate.getTime() - date.getTime());
                let hours = Math.floor((duration / (1000 * 60 * 60)));
                let minutes = Math.floor((duration / (1000 * 60)) % 60);
                let seconds = prevDate.getSeconds() - date.getSeconds();//Math.ceil((duration / 1000) % 60);
                if (seconds < 0) seconds += 60
                duration = hours + 'ч ' + minutes + 'м ' + seconds + 'с';
            }

            let text = log.text;
            let localDate = date.toLocaleString('ru-RU');
            let add = {
                message: text,
                dateStart: localDate,
                dateEnd: (localPrevDate !== undefined) ? localPrevDate : '',
                duration: (duration !== undefined) ? duration : '',
                time: date.getTime().toString()
            };
            allData.push(add);
        });
    }

    $('#logsTable')
        .bootstrapTable('load', allData)// $('#selection').prop('checked')) ? sortedData : allData)
        .bootstrapTable('scrollTo', 'top')
        .bootstrapTable('refresh', {
            data: allData
        });

    colorizeCrosses();
}

function colorizeCrosses() {
    const data = $('#logsTable').bootstrapTable('getData');
    const tableRows = $('#logsTable tbody tr');
    let switchFlag = true;
    data.forEach((row, index) => {
        if (row.time === undefined) switchFlag = !switchFlag;
        if (switchFlag) {
            $(tableRows[index]).attr('style', 'background-color: lightgray');
        } else {
            $(tableRows[index]).attr('style', '');
        }
    })
}

function prettyNumbers(number) {
    return (number < 10) ? '0' + number : number;
}

function findIdByDescription(description) {
    let id = 0;
    IDs.forEach(ID => {
        if (ID.description === description) id = ID.ID;
    });
    return id;
}

// Получение номера региона по описанию
function getRegionNum(region) {
    let num = 0;
    for (let reg in regionInfo) {
        if (regionInfo[reg] === region) num = reg;
    }
    return num.toString();
}

// Получение номера района по описанию
function getAreaNum(region, area) {
    let num = 0;
    for (let ar in areaInfo[region]) {
        if (areaInfo[region][ar] === area) num = ar;
    }
    return num.toString();
}

// Функция для сохранения логов в файл
function downloadLogs() {
    let tableData = JSON.parse(JSON.stringify($('#logsTable').bootstrapTable('getData')));
    if (tableData.length === 0) return;
    const type = $('#saveType').val();
    const fileName = 'log' +
        tableData[tableData.length - 1].dateEnd.split(', ')[0].split('.').join('') + '_' +
        tableData[tableData.length - 1].dateEnd.split(', ')[1].split(':').join('');
    if (type === 'application/vnd.ms-excel') {
        $("#logsTable").table2excel({
            // exclude: ".excludeThisClass",
            // name: "Worksheet Name",
            filename: fileName, // do include extension
            preserveColors: false // set to true if you want background colors and font colors preserved
        });
    } else {
        let exportText = '';
        tableData.forEach(row => {
            delete row.time;
            let shit = Object.values(row);
            shit.push(shit.shift());
            exportText += shit.join('\t') + '\n'
        });
        let link = document.createElement('a');

        link.download = fileName;
        let blob = new Blob([exportText], {type: type});
        link.href = window.URL.createObjectURL(blob);
        link.click();
    }
}