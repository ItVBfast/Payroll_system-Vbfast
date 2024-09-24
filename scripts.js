document.getElementById("timeInButton").addEventListener("click", timeIn);
document.getElementById("timeOutButton").addEventListener("click", timeOut);
document.getElementById("downloadExcel").addEventListener("click", downloadExcel);
document.getElementById("uploadExcel").addEventListener("change", handleFileUpload);

let employeeData = [];

function timeIn() {
    const employeeName = document.getElementById("employeeName").value;
    const startDate = document.getElementById("startDate").value;
    const organizationName = document.getElementById("organizationName").value;
    const timeIn = new Date().toLocaleTimeString();

    const hourlyRate = document.getElementById("hourlyRate").value;
    const taskCreatedBy = document.getElementById("taskCreatedBy").value;
    const listCategory = document.getElementById("listCategory").value;
    const listSubcategory = document.getElementById("listSubcategory").value;
    const particulars = document.getElementById("particulars").value;
    const targetTime = document.getElementById("targetTime").value;
    const hrsDone = document.getElementById("hrsDone").value;
    const defaultRate = document.getElementById("defaultRate").value;
    const taskCharge = document.getElementById("taskCharge").value;
    const totalErrors = document.getElementById("totalErrors").value;
    const adjustmentPayment = document.getElementById("adjustmentPayment").value;

    if (employeeName === "" || startDate === "" || organizationName === "") {
        alert("Please fill out all fields.");
        return;
    }

    const newRow = {
        employeeName,
        startDate,
        timeIn,
        timeOut: "",
        totalHours: "",
        hourlyRate,
        taskCreatedBy,
        listCategory,
        listSubcategory,
        particulars,
        targetTime,
        hrsDone,
        defaultRate,
        taskCharge,
        totalErrors,
        totalBill: 0,
        adjustmentPayment,
        adjustedNetBill: 0,
        organizationName
    };

    employeeData.push(newRow);
    updateTable();
}

function timeOut() {
    const employeeName = document.getElementById("employeeName").value;
    const organizationName = document.getElementById("organizationName").value;
    const timeOut = new Date().toLocaleTimeString();

    const row = employeeData.find(
        (data) =>
            data.employeeName === employeeName &&
            data.organizationName === organizationName &&
            data.timeOut === ""
    );

    if (row) {
        row.timeOut = timeOut;
        row.totalHours = calculateTotalHours(row.timeIn, timeOut);
        row.totalBill = calculateTotalBill(row);
        row.adjustedNetBill = row.totalBill + parseFloat(row.adjustmentPayment || 0);
        updateTable();
    } else {
        alert("Please check the employee name and organization.");
    }
}

function calculateTotalHours(timeIn, timeOut) {
    const [inHours, inMinutes, inSeconds] = timeIn.split(":").map(part => parseInt(part));
    const [outHours, outMinutes, outSeconds] = timeOut.split(":").map(part => parseInt(part));

    const inDate = new Date();
    inDate.setHours(inHours, inMinutes, inSeconds || 0);

    const outDate = new Date();
    outDate.setHours(outHours, outMinutes, outSeconds || 0);

    let diffMs = outDate - inDate;

    // Handling the case where Time Out is earlier in the day than Time In
    if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000;
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
}

function calculateTotalBill(row) {
    return parseFloat(row.hrsDone || 0) * parseFloat(row.hourlyRate || 0) + parseFloat(row.taskCharge || 0);
}

function updateTable() {
    const tbody = document.querySelector("#payrollTable tbody");
    tbody.innerHTML = "";

    employeeData.forEach((data, index) => {
        const row = tbody.insertRow();

        // Create editable cells for each row
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                const cell = row.insertCell();
                const input = document.createElement("input");
                input.value = data[key];
                input.setAttribute("data-key", key);
                input.setAttribute("data-index", index);
                cell.appendChild(input);
            }
        }

        const editCell = row.insertCell(0);
        const saveCell = row.insertCell(-1);
        const saveButton = document.createElement("button");
        saveButton.innerText = "Save";
        saveButton.addEventListener("click", () => saveRow(index));
        saveCell.appendChild(saveButton);
    });
}

function handleFileUpload(event) {
    const files = event.target.files;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            workbook.SheetNames.forEach(sheetName => {
                const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                sheetData.forEach((row) => {
                    employeeData.push({
                        employeeName: row['Employee Name'] || "",
                        startDate: row['Start Date'] || "",
                        endDate: row['End Date'] || "",
                        timeIn: row['Time In'] || "",
                        timeOut: row['Time Out'] || "",
                        totalHours: row['Total Hours'] || "",
                        hourlyRate: row['Hourly Rate'] || 0,
                        taskCreatedBy: row['Task Created By'] || "",
                        listCategory: row['List Category'] || "",
                        listSubcategory: row['List Subcategory'] || "",
                        particulars: row['Particulars'] || "",
                        targetTime: row['Target Time'] || 0,
                        hrsDone: row['Hours Done'] || 0,
                        defaultRate: row['Default Rate'] || 0,
                        taskCharge: row['Task Charge'] || 0,
                        totalErrors: row['Total Errors'] || 0,
                        totalBill: row['Total Bill'] || 0,
                        adjustmentPayment: row['Adjustment Payment'] || 0,
                        adjustedNetBill: row['Adjusted Net Bill'] || 0,
                        organizationName: row['Organization Name'] || ""
                    });
                });
            });

            updateTable();  // Ensure the table is updated with the new data
        };
        reader.readAsArrayBuffer(file);
    });
}
