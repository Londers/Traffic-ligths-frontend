// let selected;
let devices;
let IDs = [];
let regionInfo;
let areaInfo;

function sortByTime(a, b) {
    let aName = a.time.toLowerCase();
    let bName = b.time.toLowerCase();
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

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
                let region = regionInfo[devices[counter].region];
                let area = areaInfo[region][devices[counter].area];
                device.region = region;
                device.area = area;
                IDs.push({ID: device.ID, description: device.description});
                devices[counter++].ID = '';
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
            $(document.body).append('<button id="getLog" class="btn btn-secondary ml-4 mt-4">Загрузить логи</button>\n');
            $('#getLog').on('click', function () {
                // {ID: '', area: '', region: ''}
                let toSend = {devices: [], timeStart: '', timeEnd: ''};
                let selected = $('#table').bootstrapTable('getSelections');
                selected.forEach(cross => {
                    toSend.devices.push({
                        ID: findIdByDescription(cross.description),
                        area: getAreaNum(cross.region, cross.area),
                        region: getRegionNum(cross.region),
                        description: cross.description
                    });
                });
                //Отправка на сервер запроса проверки данных
                $.ajax({
                    type: 'POST',
                    url: window.location.href + '/info',
                    data: JSON.stringify(toSend),
                    dataType: 'json',
                    success: function (data) {
                        console.log(data);
                        let allData = [];
                        data.deviceLogs.forEach(log => {
                            let date = new Date(log.time);
                            let localDate = date.toLocaleString(Intl.DateTimeFormat().resolvedOptions().locale, {timeZone : Intl.DateTimeFormat().resolvedOptions().timeZone});
                            // let date = new Date(qdate.getTime() - (qdate.getTimezoneOffset() * 60 * 1000));
                            // date.getTimezoneOffset();
                            // const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                            // date = date.toLocaleDateString(undefined, options);
                            // let time = localDate.getDate() + '.' + (localDate.getMonth() + 1) + '.' + localDate.getFullYear() + ' ' + localDate.getHours() + ':' + localDate.getMinutes() + ':' + localDate.getSeconds();
                            let text = log.text;
                            let description = log.devices.description;
                            let add = {cross: description, message: text, time: time};
                            allData.push(add);
                        });
                        allData.sort(sortByTime);
                        $('#logsTable').bootstrapTable('removeAll')
                            .bootstrapTable('append', allData)
                            .bootstrapTable('scrollTo', 'top')
                            .bootstrapTable('refresh', {
                                data: allData
                            });
                    },
                    error: function (request) {
                        // if (!($('#passwordMsg').length)){
                        //     $('#passwordForm').append('<div style="color: red;" id="passwordMsg"><h5>Неверный логин и/или пароль</h5></div>');
                        // }
                        console.log(request.status + ' ' + request.responseText);
                    }
                });
            });
        },
        // data: JSON.stringify(data.state),
        error: function (request) {
            console.log(request.status + ' ' + request.responseText);
        }
    });
    // });
});

function findIdByDescription(description) {
    let id;
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
    return num;
}

//Получение номера района по описанию
function getAreaNum(region, area) {
    let num = 0;
    for (let ar in areaInfo[region]) {
        if (areaInfo[region][ar] === area) num = ar;
    }
    return num.toString();
}