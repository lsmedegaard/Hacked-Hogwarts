"use strict";

//Henter jsondata 
async function getData() {
    // henter student-data
    const studentLink = "https://petlatkea.dk/2021/hogwarts/students.json"
    const studentResponse = await fetch(studentLink)
    const studentData = await studentResponse.json()
    // henter family-data
    const familyLink = 'https://petlatkea.dk/2021/hogwarts/families.json'
    const familyResponse = await fetch(familyLink)
    const familyData = await familyResponse.json()
    return { studentData, familyData }
}


function capitalize(name) {
    // splitter name ved '-' og looper over alle dele af navnet
    const parts = name.split('-')
    let cleanName = ''
    parts.forEach((part, index) => {
        // gør første bogstav stort og resten småt
        const up = part.substring(0, 1).toUpperCase()
        const down = part.substring(1).toLowerCase()
        // sætter navne-delene sammen igen med '-' imellem
        if (index > 0) cleanName += '-'
        cleanName += up + down
    })
    return cleanName
}


function cleanData(studentData, familyMap) {
    const clean = []
    studentData.forEach(student => {
        // fjerner whitespace før og efter navnet
        let fullname = student.fullname.trim()
        // splitter ved mellemrum
        const parts = fullname.split(" ")
        // der er altid firstname, så den er uden for "if"
        const firstname = capitalize(parts[0])
        // init name-parts
        let middlename = null
        let lastname = null
        let nickname = null

        // case: fornavn "kælenavn" efternavn
        if (parts.length === 3 && parts[1].includes(`"`)) {
            nickname = capitalize(parts[1].substring(1, parts[1].lastIndexOf('"')))
            lastname = capitalize(parts[2])
            fullname = `${firstname} "${nickname}" ${lastname}`
        // case: fornavn "kælenavn"
        } else if (parts.length === 2 && parts[1].includes(`"`)) {
            nickname = capitalize(parts[1].substring(1, parts[1].lastIndexOf('"')))
            fullname = `${firstname}`
        // case: fornavn mellemnavn efternavn
        } else if (parts.length === 3) {
            middlename = capitalize(parts[1])
            lastname = capitalize(parts[2])
            fullname = `${firstname} ${middlename}   ${lastname}`
        // case: fornavn efternavn
        } else if (parts.length == 2) {
            lastname = capitalize(parts[1])
            fullname = `${firstname} ${lastname}`
        // case: fornavn
        } else {
            fullname = firstname
        }

        // trimmer og capitalizer gender og house
        const gender = capitalize(student.gender.trim());
        const house = capitalize(student.house.trim());

        // finder bloodstatus ved at slå op i familyMap, som ligner { lastname: bloodStatus }.
        // Default til "Unknown", hvis navnet ikke findes i familyData
        const bloodstatus = familyMap[lastname] || 'Unknown'

        // imagePath = lastname-x, hvor x er første bogstav i fornavnet
        // hvis der ikke er noget lastname, så er der ikke noget billede
        const imagePath = lastname ? `${lastname.toLowerCase()}_${firstname[0].toLowerCase()}` : null

        const crestPath = house.toLowerCase()

        const studentObject = {
            fullname,
            firstname,
            middlename,
            nickname,
            lastname,
            gender,
            house,
            bloodstatus,
            imagePath,
            crestPath
        }
        clean.push(studentObject)
    })

    return clean
}

function updateView () {
    // updateView kører students-array igennem alle filtre og sortering, opdaterer student-listen
    // og counts ved at kalde updateCounts til sidst()
    // 
    // Dvs. alle ændringer kan "aktiveres" i DOM ved at kalde updateView()

    const template = document.querySelector("#student_template");
    const studentsContainer = document.querySelector("#students")

    // Først fjernes listen i DOM

    studentsContainer.innerHTML = null

    // Herefter filterers listen for valgte huse og expelled students.
    // Ved at bruge [...students] laves en kopi af students-array, så oprindelig data bibeholdes

    // houseFilters er et global objekt, som sættes i toggleHouseFilters, som kaldes ved at trykke på billederne af husene i DOM.
    // expelledStudent er et globalt array, som en student tilføjes til gennem expel(), som kaldes ved at-
    // trykke på x-et ud fra en elev i DOM

    const filteredStudents = [...students].filter(student => {
        return houseFilters.includes(student.crestPath)
        && (showExpelledStudents
        ? expelledStudents.includes(student)
        : !expelledStudents.includes(student))
        && student.fullname.toLowerCase().includes(searchString.toLowerCase())
    })

    // Listen sorteres efter sortKey og sortOrder, der er globale variable, som sættes vha. sort-funktionen,
    // der kaldes ved at trykker på headers i DOM

    sortedStudents = filteredStudents.sort((a, b) => a[sortKey] > b[sortKey] ? sortOrder : sortOrder * -1)

    // tjekker om hackTheSystem() er aktiveret (ved at trykke på knappen i DOM).
    // hvis den er aktiveret er den globale variabel hacked === true, og jeg tilføjer mig selv til listen
    // ved at pushe myObject til sortedstudents.
    // Desuden blandes elevernes bloodStatus, således at Pure bliver til Half eller Unknown, og Half/Unknown
    // bliver til Pure

    if (hacked) {
        sortedStudents.push(myObject)
        sortedStudents.forEach(student => {
            if (student.bloodstatus === 'Pure') {
                student.bloodstatus = ['Half', 'Unknown'][Math.floor(Math.random() * 2)]
            } else student.bloodstatus = 'Pure'
        })
    }

    // sortedStudents tilføjes til DOM, og der tilføjes data-student-index, til de elementer, der har
    // onClick-funktion, så elementet kan identificeres i eventHandler-funktionerne

    sortedStudents.forEach((student, index) => {
        student.listIndex = index
        const clone = template.cloneNode(true).content;
        clone.querySelector(".student_info").setAttribute('data-student-index', index)
        clone.querySelector(".expel").setAttribute('data-student-index', index)
        clone.querySelector(".prefect").setAttribute('data-student-index', index)
        clone.querySelector(".student_firstname").textContent = student.firstname
        clone.querySelector(".student_lastname").textContent = student.lastname || '-'
        clone.querySelector(".student_house").textContent = student.house
        if (student.house === 'Slytherin' && student.bloodstatus === 'Pure') clone.querySelector(".inq_squad").classList.add('show')
        studentsContainer.appendChild(clone)
    });

    // til sidst opdateres counts
    updateCount()
}

function updateCount () {
    // updateCount tæller total antal elever, antal expelled elever, antal viste elever og antaler elever
    // i hvert hus, og opdaterer DOM med de rette værdier
    const countsDiv = document.querySelector('#counts')
    const houses = [ 'gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff' ]
    // tæller antal elever i hvert hus ved at .filter students og tage length på array
    houses.forEach(house => {
        countsDiv.querySelector(`#${house} .count`).textContent = students.filter(student => student.crestPath === house).length
    })
    countsDiv.querySelector('#total .count').textContent = students.length
    countsDiv.querySelector('#listed .count').textContent = sortedStudents.length
    countsDiv.querySelector('#expelled .count').textContent = expelledStudents.length
}



function showPopup (studentElement) {
    // showPopup er eventHandler for onClick på en elev i DOM
    const studentIndex = studentElement.getAttribute('data-student-index')
    const student = sortedStudents[studentIndex]

    // vis popup ved at tilføje class show
    const popup = document.querySelector("#popup")
    popup.classList.add("show")

    // sæt alle værdier for student fra studentObject og imagePath, hvis den findes
    popup.querySelector("#popup_fullname").textContent = student.fullname
    popup.querySelector("#popup_gender").textContent = student.gender
    popup.querySelector("#popup_house").textContent = student.house
    popup.querySelector("#popup_bloodstatus").textContent = student.bloodstatus
    if (student.imagePath) popup.querySelector("#popup_image").setAttribute('src', `images/${student.imagePath}.png`)
    if (student.crestPath) popup.querySelector("#crest_image").setAttribute('src', `images/${student.crestPath}.png`)


    // sæt baggrundsfarve efter hus
    const colorMap = {
        'Gryffindor': '#740001',
        'Slytherin': '#1A472A',
        'Ravenclaw': '#0E1A40',
        'Hufflepuff': '#FFDB00'

    }

    popup.style.background = colorMap[student.house]

}

function closePopup () {
    // luk popup ved at fjerne class "show"
    document.querySelector("#popup").classList.remove("show")
}

function sortBy (key) {
    // hvis den allerede er sat til at sortere efter den header, der blev trykket på, skal den skifte
    // retningen ved at skifte fortegn på sortOrder
    if (sortKey === key) sortOrder *= -1
    // hvis den ikke er sat til at sortere efter den header, der blev trykket på, så skal den sætte
    // sorteringen efter den header og nulstille retningen (sortOrder = 1)
    else {
        sortKey = key
        sortOrder = 1
    }
    updateView()
}

function toggleHouseFilter (house) {
    const houseFilterElement = document.querySelector(`#${house}`)
    // hvis filter er aktivt for det hus, der trykkes på, sættes den til inaktiv ved at fjerne
    // den fra houseFilters array og tilføje 'unselected' class, som sætter 100% grayscale
    if (houseFilters.includes(house)) {
        houseFilters.splice(houseFilters.indexOf(house), 1)
        houseFilterElement.classList.add('unselected')
    // hvis filter ikke er aktivt for det hus, der trykkes på, sætttes den til aktiv, ved at tilføje
    // huset til houseFilters array og fjerne 'unselected' class
    } else {
        houseFilters.push(house)
        houseFilterElement.classList.remove('unselected')
    }
    updateView()
}

function expelStudent (studentElement) {
    // find den rette student vha. 'data-student-index' på elementet, der trykkes på (passes som this)
    const studentIndex = studentElement.getAttribute('data-student-index')
    const student = sortedStudents[studentIndex]
    // gør så jeg ikke selv kan blive expelled, og viser en warning på skærmen i 2 sekunder,
    // hvis det forsøges
    if (student.firstname === 'Lasse') {
        document.querySelector('#warning').classList.add('show')
        setTimeout(() => {
            document.querySelector('#warning').classList.remove('show')
        }, 2000)
        return null
    }
    // tilføj den elev, der blev expelled til globalt array expelledStudents,
    // som bruges af .filter i updateView()
    expelledStudents.push(student)
    updateView()
}
 
function toggleExpelledStudents () {
    // toggle showExpelledStudents mellem true og false og fed tekst i DOM
    showExpelledStudents = !showExpelledStudents
    document.querySelector('#expelled_filter').classList.toggle('strong')
    updateView()
}

function togglePrefects (studentElement) {
    // find den rette student vha. 'data-student-index' på elementet, der trykkes på (passes som this)
    const studentIndex = studentElement.getAttribute('data-student-index')
    const student = sortedStudents[studentIndex]
    // hvis student allerede er prefect, så fjern student fra prefect og selected class fra stjernen
    if (prefects[student.crestPath].includes(student)) {
        prefects[student.crestPath].splice(prefects[student.crestPath].indexOf(student), 1)
        studentElement.classList.remove('selected')
    // hvis der allerede er 2 prefects i samme hus som student,
    // så gør student til prefect og fjern den første af de 2
    } else if (prefects[student.crestPath].length === 2) {
        const removedStudent = prefects[student.crestPath].splice(0, 1)[0]
        document.querySelector(`.prefect[data-student-index="${removedStudent.listIndex}"`).classList.remove('selected')
        prefects[student.crestPath].push(student)
        studentElement.classList.add('selected')
    // hvis ingen af ovenstående cases, så gør student til prefect
    } else {
        prefects[student.crestPath].push(student)
        studentElement.classList.add('selected')
    }
}

function toggleInqSquad (studentElement) {
    // toggle farve på inq-squad ikonet
    studentElement.classList.toggle('selected')
    // hvis hackTheSystem() er aktiv, så gør effekten midlertidig (3 sek)
    if (hacked) setTimeout(() => {
        studentElement.classList.remove('selected')
    }, 3000)
}

function search (searchInput) {
    // sæt searchString til værdien af søgefeltet.
    // searchString bruges i .filter i updateView()
    searchString = searchInput.value
    updateView()
}

function hackTheSystem() {
    // sæt global variabel hacked til true
    // hacked bruges i updateView() og toggleInqSquad() til at implementere hacking-effekterne
    hacked = true
    updateView()
}

let searchString = ''
let students = null
let sortedStudents = null
let sortKey = 'firstname'
let sortOrder = 1
let houseFilters = [ 'gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff' ]
let expelledStudents = []
let showExpelledStudents = false
let prefects = {
    'gryffindor': [],
    'slytherin': [],
    'ravenclaw': [],
    'hufflepuff': [],
}
let hacked = false
let myObject = {
    fullname: 'Lasse Mark Smedegaard',
    firstname: 'Lasse',
    middlename: 'Mark',
    lastname: 'Smedegaard',
    bloodstatus: 'Pure',
    house: 'Ravenclaw',
    crestPath: 'ravenclaw',
    imagePath: 'smedegaard-l'
}

// initialize 
async function initialize () {
    const data = await getData()
    const familyMap = {}
    data.familyData.half.forEach(lastname => familyMap[lastname] = 'Half')
    data.familyData.pure.forEach(lastname => familyMap[lastname] = 'Pure')
    students = cleanData(data.studentData, familyMap)
    updateView()
}

initialize()

