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
                let timeStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
                let timeEnd = now.toISOString();
                getLogs(timeStart, timeEnd, true);
            });

            $('#chosenTime').on('click', () => {
                // let now = new Date();
                // now = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000));
                let timeStart = $('#dateStart')[0].value + 'T' + $('#timeStart')[0].value + ':00Z';
                let timeEnd = $('#dateEnd')[0].value + 'T' + $('#timeEnd')[0].value + ':00Z';
                if ((new Date(timeStart).getTime()) >= (new Date(timeEnd).getTime())) {
                    alert('Неверно задано время');
                    return;
                }
                getLogs(timeStart, timeEnd, false);
            });

            $('#toggleTable').on('click', () => {
                toggleTable($('.col-md-4').css('display') === 'block');
                $('#logsTable').bootstrapTable('resetView');
            });
            // берешь при сутках дату с экрана, надо брать сутки рукми, как ты недавно поменял на кнопке

            $('#type').on('change', () => {
                type = Number($('#type').val());
                buildLogsTable(undefined, true);
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
    $('input[data-field="time"]').parent().remove();
    $('input[data-field="id"]').parent().remove();
    $('#logsTable').on('reorder-column.bs.table post-body.bs.table', function () {
        makeMergedDesc($('#logsTable').bootstrapTable('getData'))
        colorizeCrosses()
    })
});

function toggleTable(state) {
    $('#toggleTable').text(state ? 'Показать таблицу' : 'Скрыть таблицу');
    if (state) {
        $('.col-md-4').hide();
        $('.col-md-8').removeClass('col-md-8').addClass('col-md-12');
    } else {
        $('.col-md-4').show();
        $('.col-md-12').removeClass('col-md-12').addClass('col-md-8');
    }
    $('#table').bootstrapTable();
    $('#logsTable').bootstrapTable();
}

function getLogs(start, end, chosenTimeFlag, remoteOpenFlag) {
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
            buildLogsTable(data, chosenTimeFlag, start, end);
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
                if (log.time !== data[dev][index + 1].time) {
                    collapsedData[dev].push(log);
                }
            } else {
                collapsedData[dev].push(log);
            }
        })
    }
    return collapsedData;
}

function buildLogsTable(data, chosenTimeFlag, start, end) {
    (data === undefined) ? data = dataSave : dataSave = data;

    let journalFlag = false;

    let filteredData = collapseDuplicates(filterByType(data));

    let allData = new Array(filteredData.length);

    for (const dev in filteredData) {
        filteredData[dev].forEach((log, index) => {
            if (log.text === '') journalFlag = true;
            if (index === 0) {
                if (!journalFlag) {
                    allData.push({
                        message: JSON.parse(dev).description,
                        dateStart: JSON.parse(dev).description,
                        dateEnd: JSON.parse(dev).description,
                        duration: JSON.parse(dev).description,
                        id: log.id,
                    });
                } else {
                    allData.push({
                        dateStart: JSON.parse(dev).description,
                        dateEnd: JSON.parse(dev).description,
                        duration: JSON.parse(dev).description,
                        message: JSON.parse(dev).description,
                        device: JSON.parse(dev).description,
                        arm: JSON.parse(dev).description,
                        status: JSON.parse(dev).description,
                        rez: JSON.parse(dev).description,
                        phase: JSON.parse(dev).description,
                        nk: JSON.parse(dev).description,
                        ck: JSON.parse(dev).description,
                        pk: JSON.parse(dev).description,
                        id: log.id,
                    });
                }
            }
            let localPrevDate, duration;
            let date = new Date(log.time);

            if (index < filteredData[dev].length) {
                if ((chosenTimeFlag) && (index === (filteredData[dev].length - 1))) {
                    date = new Date($('#dateStart')[0].value + 'T' + $('#timeStart')[0].value + ':00.00' + log.time.slice(-6));
                }
                let prevDate;
                if (index === 0) {
                    if (chosenTimeFlag) {
                        prevDate = dateSave;
                    } else {
                        prevDate = new Date($('#dateEnd')[0].value + 'T' + $('#timeEnd')[0].value + ':00.00' + log.time.slice(-6));
                    }
                } else {
                    prevDate = new Date(filteredData[dev][index - 1].time);
                }
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
                time: date.getTime().toString(),
                id: log.id,
            };
            allData.push(validateForJournal(add, log));
        });
    }

    validateColumns(journalFlag);
    $('#logsTable')
        .bootstrapTable('load', allData)// $('#selection').prop('checked')) ? sortedData : allData)
        .bootstrapTable('scrollTo', 'top')
        .bootstrapTable('refresh', {
            data: allData
        });
    if (journalFlag) makeMergedDesc(allData)
    toggleTable(journalFlag);
    colorizeCrosses();
    $('#logsTable').trigger('resize')
}

function makeMergedDesc(data) {
    const visibleColumns = $('#logsTable').bootstrapTable('getVisibleColumns');
    data.forEach((row, index) => {
        if (row.dateStart === row.duration) {
            $('#logsTable').bootstrapTable('mergeCells',
                {
                    index,
                    field: visibleColumns[0].field,
                    colspan: visibleColumns.length,
                    rowspan: 1
                }
            )
        }
    })
    $('td[rowspan=1]').addClass('text-center');
}

function switchColumnsByType(type) {
    const $table = $('#logsTable');
    switch (type) {
        case 0: // 0 - технология
            $table.bootstrapTable('showAllColumns');
            $table.bootstrapTable('hideColumn', ['time', 'id', 'message', 'status', 'phase', 'device']);
            // $table.bootstrapTable('orderColumns', {
            //     dateStart: 0,
            //     dateEnd: 1,
            //     duration: 2,
            //     rez: 3,
            //     arm: 4,
            //     nk: 5,
            //     ck: 6,
            //     pk: 7,
            // })
            break;
        case 1: // 1 - по устройству
            $table.bootstrapTable('showAllColumns');
            $table.bootstrapTable('hideColumn', ['time', 'id', 'message', 'nk', 'ck', 'pk']);
            // $table.bootstrapTable('orderColumns', {
            //     dateStart: 0,
            //     dateEnd: 1,
            //     duration: 2,
            //     device: 3,
            //     arm: 4,
            //     status: 5,
            //     rez: 6,
            //     phase: 7
            // })
            break;
        case 2: // 2 - двери и лампы
            $table.bootstrapTable('showAllColumns');
            $table.bootstrapTable('hideColumn', ['time', 'id', 'device', 'arm', 'status', 'rez', 'phase', 'nk', 'ck', 'pk']);
            break;
    }
}

function validateForJournal(add, log) {
    if (add.message === '') {
        delete add.message;
        add.arm = log.journal.arm;
        add.pk = log.journal.pk;
        add.ck = log.journal.ck;
        add.nk = log.journal.nk;
        add.device = log.journal.device;
        add.phase = log.journal.phase;
        add.rez = log.journal.rez;
        add.status = log.journal.status;
    }
    return add;
}

function validateColumns(hasJournal) {
    $('#logsTable').bootstrapTable(!hasJournal ? 'showColumn' : 'hideColumn', 'message')
    switchColumnsByType(type)
}

function colorizeCrosses() {
    const data = $('#logsTable').bootstrapTable('getData');
    const tableRows = $('#logsTable tbody tr');
    let switchFlag = true;
    data.forEach((row, index) => {
        if (row.time === undefined) switchFlag = !switchFlag;
        $(tableRows[index]).attr('style', switchFlag ? 'background-color: lightgray' : '');
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
            delete row.id;
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

function dateStartSorter(aStart, bStart, aRow, bRow) {
    const chosenDevices = $('#table').bootstrapTable('getSelections').map(dev => dev.idevice);
    if (chosenDevices.findIndex(dev => dev === aRow.id) === chosenDevices.findIndex(dev => dev === bRow.id)) {
        if ((aRow.dateStart !== aRow.duration) && (bRow.dateStart !== bRow.duration)) {
            return bRow.time - aRow.time;
        }
    }
    return 0;
}

//Функция для открытия вкладки
function openPage(url) {
    window.open(location.origin + '/user/' + localStorage.getItem('login') + url);
}