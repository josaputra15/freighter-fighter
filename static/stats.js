
// quick fetching logic

const statNames = ["started", "won", "made", "hit", "missed"];

// get all of our stats
async function fetchStats(){
    let stats = []
    for(let i=0; i<statNames.length; i++){
        let response = await fetch("/get_stat/"+statNames[i]);
        let json = await response.json();
        stats.push(Number(json.number));
    }
    return stats
}

// create our charts from the fetched stats
async function createCharts(){
    let stats = await(fetchStats())
    const gameCanvas = document.getElementById("games")
    const guessCanvas = document.getElementById("guesses")
    
    // TODO: add alt text for the canvases
    new Chart(gameCanvas, {
        type: 'pie',
        data: {
          labels: ['Games Unfinished', 'Games Finished'],
          datasets: [{
            data: [stats[0]-stats[1], stats[1]],
            backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)'
            ],
            borderWidth: 1
          }]
        }
    });

    new Chart(guessCanvas, {
        type: 'pie',
        data: {
          labels: ['Guesses Hit', 'Guesses Missed'],
          datasets: [{
            data: [stats[3], stats[4]],
            backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)'
            ],
            borderWidth: 1
          }]
        }
    });
}

createCharts()


// let stats = ["started", "won", "made", "hit", "missed"];

// async function poopFart() {
//     for(let i=0; i<5; i++) {
//         let stat = stats[i];
//         console.log(stat);
//         console.log("/get_stat/"+stat);
//         let response = await fetch("/get_stat/"+stat);
//         let json = await response.json();
//         console.log(json.number);
//     }
// }

// poopFart()

// async function fetchStats(){
//     for(let i=0; i<stats.length; i++){
//         let response = await fetch("/get_stat/"+stats[i]);
//         let json = await response.json();
//         document.getElementById(stats[i]).innerText = json.number;
//     }
// }

// fetchStats();
