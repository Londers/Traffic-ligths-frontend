let dataSave;
let devices;
let IDs = [];
let regionInfo;
let areaInfo;
//0 - технология, 1 - по устройству, 2 - двери+лампы
let type = 0;

let dateSave;
// function sortByTime(a, b) {//new Date(log.time)
//     return new Date(b.time).getTime() - new Date(a.time).getTime();
// }

$(function () {
    // $('#sendButton').on('click', function () {
    $.ajax({
        url: window.location.href,
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            regionInfo = Object.assign({}, data.regionInfo);
            areaInfo = Object.assign({}, data.areaInfo);
            devices = data.devices.slice();
            let counter = 0;
            data.devices.forEach(device => {
                let region, area;
                if (device.idevice !== -1) {
                    region = regionInfo[devices[counter].region];
                    area = areaInfo[region][devices[counter].area];
                    device.region = region;
                    device.area = area;
                    IDs.push({ID: device.ID, description: device.description});
                    devices[counter].ID = '';
                }
                counter++;
            });
            console.log(data);

            $('#table')
                .bootstrapTable('removeAll')
                .bootstrapTable('append', data.devices)
                .bootstrapTable('scrollTo', 'top')
                .bootstrapTable('refresh', {
                    data: data.devices
                });
            // console.log(data.result);
            // disableControl('forceSendButton', true);
            // disableControl('sendButton', false);

            // counter = 0;
            // $('.fixed-table-toolbar').each(function () {
            //     $(this).attr('id', 'toolbar' + counter++)
            // });

            // .append('<div class="form-check mt-3">\n' +
            //     '<label class="form-check-label">\n' +
            //     '<input type="checkbox" class="form-check-input" id="selection" value="">\n' +
            //     'Показать изменения режима\n' +
            //     '</label>\n' +
            //     '</div>')

            let now = new Date();
            $('#dateEnd').attr('value', (now.toISOString().slice(0, 10)));
            $('#timeEnd').attr('value', (prettyNumbers(now.getHours()) + ':' + prettyNumbers(now.getMinutes())));
            now = new Date(now.getTime() - ((((now.getHours() * 60 + now.getMinutes() + now.getTimezoneOffset()) * 60 + now.getSeconds()) * 1000) + now.getMilliseconds()));//((24 * 60) * 60 * 1000)); // - (now.getTimezoneOffset() * 60 * 1000));
            $('#dateStart').attr('value', (now.toISOString().slice(0, 10)));
            $('#timeStart').attr('value', (prettyNumbers(now.getUTCHours()) + ':' + prettyNumbers(now.getUTCMinutes())));
            $('#currentDay').on('click', () => {
                now = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60 * 1000));
                let timeStart = $('#dateStart')[0].value + 'T' + $('#timeStart')[0].value + ':00Z';
                let timeEnd = now.toISOString();
                getLogs(timeStart, timeEnd, true);
            });

            // $('#timeButton1').on('click', () => {
            //     let now = new Date();
            //     now = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
            //     let timeStart = timeCalc(now, 30 * 60);
            //     let timeEnd = now.toISOString();
            //     getLogs(timeStart, timeEnd);
            // });

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

            if (localStorage.getItem('region') !== 'undefined') {
                crutchFlag = true;
                let now = new Date();
                now = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
                let timeStart = $('#dateStart')[0].value + 'T' + $('#timeStart')[0].value + ':00Z';
                let timeEnd = now.toISOString();
                getLogs(timeStart, timeEnd, true, true);
            };
        },
        // data: JSON.stringify(data.state),
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
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
            localStorage.setItem('description', undefined);
        } else {
            $('#toolbar0').append('<div style="color: red;" id="toolbar0Msg"><h5>Выберите устройства</h5></div>');
            return;
        }
    } else {
        $('#toolbar0Msg').remove();
    }
    //Отправка на сервер запроса проверки данных
    $.ajax({
        type: 'POST',
        url: window.location.href + '/info',
        data: JSON.stringify(toSend),
        dataType: 'json',
        success: function (data) {
            dateSave = new Date();
            buildLogTable(data, crutchFlag)
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
        }
    });
    console.log(toSend);
}

function filterByType(data) {
    let filteredData = [];
    for (let dev in data.deviceLogs) {
        filteredData[dev] = [];
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
    let allData = [];

    let filteredData = collapseDuplicates(filterByType(data));

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
                if ((crutchFlag) && (index === (filteredData[dev].length - 1))) date = new Date($('#dateStart')[0].value + 'T' + $('#timeStart')[0].value + ':00.00' + log.time.slice(-6));
                let prevDate = (index === 0) ? dateSave : new Date(filteredData[dev][index - 1].time);
                localPrevDate = prevDate.toLocaleString('ru-RU', {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone});
                duration = Math.floor(prevDate.getTime() - date.getTime()) + date.getTimezoneOffset() * 60 * 1000;// 1000);
                let hours = new Date(duration).getHours();
                let minutes = new Date(duration).getMinutes();
                let seconds = new Date(duration).getSeconds();
                duration = hours + 'ч ' + minutes + 'м ' + seconds + 'с';
            }
            let text = log.text;
            let localDate = date.toLocaleString('ru-RU', {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone});
            let add = {
                message: text,
                dateStart: localDate,
                dateEnd: (localPrevDate !== undefined) ? localPrevDate : '',
                duration: (duration !== undefined) ? duration : '',
                time: date.getTime()
            };

            allData.push(add);
        });
        if (!crutchFlag) allData.pop();
    }

    $('#logsTable')
        .bootstrapTable('load', (allData))//$('#selection').prop('checked')) ? sortedData : allData)
        .bootstrapTable('scrollTo', 'top')
        .bootstrapTable('refresh', {
            data: allData
        });
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

//Получение номера региона по описанию
function getRegionNum(region) {
    let num = 0;
    for (let reg in regionInfo) {
        if (regionInfo[reg] === region) num = reg;
    }
    return num.toString();
}

//Получение номера района по описанию
function getAreaNum(region, area) {
    let num = 0;
    for (let ar in areaInfo[region]) {
        if (areaInfo[region][ar] === area) num = ar;
    }
    return num.toString();
}