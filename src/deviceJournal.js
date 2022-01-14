let devices;
let IDs = [];
let regionInfo;
let areaInfo;

$(function () {
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
                    IDs.push({ID: device.ID, idevice: device.idevice, description: device.description});
                    devices[counter].ID = '';
                }
            });

            $('#table').bootstrapTable('hideLoading');
            $('#table')
                .bootstrapTable('removeAll')
                .bootstrapTable('append', data.devices)
                .bootstrapTable('scrollTo', 'top')
                .bootstrapTable('refresh', {
                    data: data.devices
                });

        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            alert(JSON.parse(request.responseText).message);
        }
    });

    $('#getJournals').on('click', getJournals)
    $('#clearJournals').on('click', clearJournals)
    $('#journalsTable').on('reorder-column.bs.table post-body.bs.table', function () {
        makeMergedDesc($('#journalsTable').bootstrapTable('getData'))
        colorizeCrosses()
    })
})

function getJournals() {
    $('#journalsTable').bootstrapTable('removeAll')
    let devices = [];
    let selected = $('#table').bootstrapTable('getSelections');
    selected.forEach(cross => {
        devices.push({
            ID: findIdByDescription(cross.description),
            area: getAreaNum(cross.region, cross.area),
            region: getRegionNum(cross.region),
            description: cross.description,
            idevice: cross.idevice,
        });
    });

    $.ajax({
        type: 'POST',
        url: window.location.href + '/info',
        data: JSON.stringify({devices: devices}),
        dataType: 'json',
        success: function (data) {
            buildJournalsTable(data)
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            alert(JSON.parse(request.responseText).message);
        }
    });
}

function clearJournals() {
    const devices = [];
    const selected = $('#table').bootstrapTable('getSelections');
    selected.forEach(cross => {
        devices.push({
            ID: findIdByDescription(cross.description),
            area: getAreaNum(cross.region, cross.area),
            region: getRegionNum(cross.region),
            description: cross.description,
            idevice: cross.idevice,
        });
    });

    $.ajax({
        type: 'POST',
        url: window.location.href + '/clear',
        data: JSON.stringify({devices: devices}),
        dataType: 'json',
        success: function () {
            $('#journalsTable').bootstrapTable('removeAll')
            $('#table').bootstrapTable('remove', {field: 'idevice', values: devices.map(device => device.idevice)})
        },
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
            alert(JSON.parse(request.responseText).message);
        }
    });
}

function buildJournalsTable(data) {
    Object.entries(data.deviceJournals).forEach(([idevice, journal]) => {
        journal.forEach((rec, i) => journal[i].time = new Date(rec.time).toLocaleString('ru-RU'));
        journal.sort((a, b) => {
            return new Date(b.time).getTime() - new Date(a.time).getTime()
        });
        journal.unshift({time: findDescriptionByIdevice(Number(idevice))})
        $('#journalsTable').bootstrapTable('append', journal)
    })
}

function findDescriptionByIdevice(idevice) {
    let description = '';
    IDs.forEach(ID => {
        if (ID.idevice === idevice) description = ID.description;
    });
    return description;
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

function makeMergedDesc(data) {
    const visibleColumns = $('#journalsTable').bootstrapTable('getVisibleColumns');
    data.forEach((row, index) => {
        if (row.record === undefined) {
            $('#journalsTable').bootstrapTable('mergeCells',
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

function colorizeCrosses() {
    const data = $('#journalsTable').bootstrapTable('getData');
    const tableRows = $('#journalsTable tbody tr');
    let switchFlag = true;
    data.forEach((row, index) => {
        if (row.record === undefined) switchFlag = !switchFlag;
        $(tableRows[index]).attr('style', switchFlag ? 'background-color: lightgray' : '');
    })
}

//Отправка команды на очищение журнала
function controlSend(toSend) {
    ws.send(JSON.stringify({type: 'dispatch', id: toSend.id, cmd: toSend.cmd, param: toSend.param}));
}