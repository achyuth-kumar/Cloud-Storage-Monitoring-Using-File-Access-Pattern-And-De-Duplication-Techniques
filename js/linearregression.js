function linearRegression(scatterData,regressionData) {
    const scatterDataArray = JSON.parse(scatterData);
    const regressionDataArray = JSON.parse(regressionData);
    console.table(scatterDataArray);
    console.table(regressionDataArray);
    const ctx = document.getElementById('myChart').getContext('2d');
    const scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Scatter Dataset',
                data: scatterDataArray,
                borderColor: 'black',
                backgroundColor: 'black'
            }, {
                data: regressionDataArray,
                label: 'Line',
                borderColor: 'green',
                backgroundColor: 'transparent',
                type: 'line'
            }],
        },
        options: {

        }
    });
}