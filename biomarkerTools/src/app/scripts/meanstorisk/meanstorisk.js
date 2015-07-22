var uniqueKey;
var thisTool;
var valuesFromFile = [];
var numberOfRows;
var numberOfCols;


var ppv_tabs = {
    "PPV": "PPV = Positive Predictive Value (PPV)",
    "cNPV": "cNPV = 1 - PPV = Compliment of the Negative Predictive Value",
    "Risk Difference": "PPV - cNPV",
    "Cases per 1000 Screened": "# of Cases Detected per 1000 Screened",
    "Cases per 1000 Positive": "# of Cases Detected per 1000 Who Screened Positive",
    "Cases per 1000 with Disease": "# of Cases Detected per 1000 with the Disease"
};


$(document).ready(function() {
    thisTool = $("#meanstorisk");
    bind_calculate_button();
    bind_download_button();
    bind_option_choices();
    thisTool.find("#please_wait_calculate").modal({ autoOpen: false, position: 'top', title: "Please Wait", height: 60 });
    thisTool.find("#please_wait_download").modal({ autoOpen: false, position: 'top', title: "Please Wait", height: 60 });
    thisTool.find("#download_button").addClass('hide');
    thisTool.find(".data_entry_by_input").on('click', function () {
        thisTool.find("#download_button").addClass('hide');
    });
    thisTool.find('.panel-heading a').on('click',function(e){
        if($(this).parents('.panel').children('.panel-collapse').hasClass('in')){
            e.preventDefault();
            e.stopPropagation();
        }
    });
    // on panel show
    thisTool.find('#file_upload, #cases_control').on('show.bs.collapse', function(){
        if(this.id == "file_upload"){
            $('#cases_control').collapse('hide');
        }
        else{
            $('#file_upload').collapse('hide');
        }

        thisTool.find('.panel-body').not( document.getElementById(this.id) )
            .removeClass('in')
            .addClass('collapse');
    });
});

function prepare_upload (e){
    files = e.target.files;
    if ( window.FileReader ) {
        var fr = new FileReader();
        fr.onload = function(e) {
            var txt = e.target.result;
            var lines = txt.split("\n");
            if (lines.length > 0) numberOfCols = lines[0].split(",").length;
            numberOfRows = 0;
            for (count = 0; count < lines.length;count++) {
                var arr = lines[count].split(",");
                if (!isNaN(arr[0]) && !isNaN(arr[1]) ) {
                    valuesFromFile = valuesFromFile.concat(arr);
                    numberOfRows++;
                }
            }
        };
        fr.readAsText(files[0]);
    }
    else {
        var filePath = $("#input_file_upload").val();
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var textStream = fso.OpenTextFile(filePath);
        var fileData = textStream.ReadAll();
        var lines = fileData.split("\n");
        numberOfRows = lines.length;
        if (numberOfRows > 0) numberOfCols = lines[0].split(",").length;

        for (count = 0; count < lines.length;count++) {

            var arr = lines[count].split(",");
            if (!isNaN(arr[0]) && !isNaN(arr[1]) ) {
                valuesFromFile = valuesFromFile.concat(arr);
            }
        }
    }
}

function bind_option_choices() {
    thisTool.find("#accordion").collapse({
        toggle: false
    });

    $( "#input_file_upload" ).on('change', prepare_upload);

}


function bind_calculate_button() {
    thisTool.find("#calculate_button").click(function() {
        if (thisTool.find("#accordion").find(".panel-body:first").hasClass("in")) {	
            // Quick check to make sure there a file.
            if (valuesFromFile.length === 0) {
                alert("Please Upload a file or pick the normalized option and enter key data first");
            } else {
                thisTool.find("#please_wait_calculate").modal("show");
                get_inputs_for_user_defined_calculation();
                make_ajax_call_user_defined_calculation();				
            }
        } else {
            thisTool.find("#please_wait_calculate").modal("show");
            get_inputs_for_standard_calculation();
            make_ajax_call_standard_calculation();			
        }
    });
}

function bind_download_button() {
    thisTool.find("#download_button").click(function() {
        var activePanelIndex = thisTool.find("#accordion .collapse.in").index() - 2;
        if (activePanelIndex === 0	) {			
            // Quick check to make sure there a file.
            if (valuesFromFile.length === 0) {
                alert("Please Upload a file or pick the normalized option and enter key data first");
            } else {
                thisTool.find("#please_wait_download").modal("show");
                get_inputs_for_user_defined_calculation();
                make_excel_call_user_defined_calculation();
            }
        } else {
            thisTool.find("#please_wait_download").modal("show");
            get_inputs_for_standard_calculation();
            make_excel_call_standard_calculation();	
        }
    });
}

function ajax_error(jqXHR, exception)
{	
    refreshGraph(1);
    alert("ajax problem");
}


/// -----------------------------------------------
/// Computation Functions

function get_inputs_for_user_defined_calculation () {
    specificity_string="" + thisTool.find("#specificity").val() + ""; 
    prevalence_string="" + thisTool.find("#prevalence").val() + ""; 

}

function get_inputs_for_standard_calculation () {

    var mean_cases = parseFloat(thisTool.find("#mean_cases_input").val());
    var mean_controls = parseFloat(thisTool.find("#mean_controls_input").val());
    var stderr_cases = parseFloat(thisTool.find("#stderr_cases_input").val());
    var stderr_controls = parseFloat(thisTool.find("#stderr_controls_input").val());
    var N_cases = parseFloat(thisTool.find("#N_cases_input").val());
    var N_controls = parseFloat(thisTool.find("#N_controls_input").val());

    cases_string="" +mean_cases+","+stderr_cases+","+N_cases+"";
    controls_string="" +mean_controls+","+stderr_controls+","+N_controls+"";
    specificity_string="" + thisTool.find("#specificity").val() + "";
    prevalence_string="" + thisTool.find("#prevalence").val() + "";

    //	alert(cases_string + "\n" + controls_string + "\n" + specificity_string + "\n" + prevalence_string);
    //	set_standard_inputs(mean_cases,mean_controls,stderr_cases,stderr_controls,N_cases,N_controls);
}


// The function below is no longer used.  We take the values from the output and no longer compute it going in.
function set_standard_inputs(mean_cases,mean_controls,stderr_cases,stderr_controls,N_cases,N_controls) {

    // First the input values
    set_value("#mean_cases",mean_cases);	
    set_value("#mean_controls",mean_controls);	
    set_value("#stderr_cases",stderr_cases);	
    set_value("#stderr_controls",stderr_controls);	
    set_value("#N_cases",N_cases);	
    set_value("#N_controls",N_controls);	

    // Now the derived values
    var deviation_cases= stderr_cases * Math.sqrt(N_cases);
    set_value("#deviation_cases",deviation_cases.toPrecision(4) );
    var deviation_controls= stderr_controls * Math.sqrt(N_controls);
    set_value("#deviation_controls",deviation_controls.toPrecision(4) );
    var variance_cases= deviation_cases * deviation_cases;	
    set_value("#variance_cases",variance_cases.toPrecision(4) );
    var variance_controls= deviation_controls * deviation_controls;	
    set_value("#variance_controls",variance_controls.toPrecision(4) );
    var variance_overall = ( (N_cases * variance_cases) + (N_controls * variance_controls) )/ (N_cases + N_controls);
    set_value("#variance_overall",variance_overall.toPrecision(4) );

    var mean_overall = ( (N_cases * mean_cases) + (N_controls * mean_controls) )/ (N_cases + N_controls);
    set_value("#mean_overall",mean_overall.toPrecision(4) );

    var N_overall = N_cases + N_controls;
    set_value("#N_overall",N_overall.toPrecision(4) );

    var cv_cases = Math.sqrt(variance_cases) / mean_cases;
    set_value("#cv_cases",cv_cases.toPrecision(4) );
    var cv_controls = Math.sqrt(variance_controls) / mean_controls;
    set_value("#cv_controls",cv_controls.toPrecision(4) );
    var cv_overall = Math.sqrt(variance_overall) / mean_overall;
    set_value("#cv_overall",cv_overall.toPrecision(4) );

    var difference_in_mean = mean_cases - mean_controls;
    set_value("#mean_difference",difference_in_mean.toPrecision(4) );
    set_value("#diff_overall",difference_in_mean.toPrecision(4) );

    var delta = difference_in_mean / Math.sqrt(variance_overall);
    set_value("#delta_overall",delta.toPrecision(4) );

    delta_string = "c("+delta.toPrecision(4)+")";

}

function make_ajax_call_user_defined_calculation() {
    //alert(cases_string + "\n" + controls_string + "\n" + specificity_string + "\n" + prevalence_string);
    uniqueKey = (new Date()).getTime();	
    hostname = window.location.hostname;
    url = "http://" + hostname +"/" + rest + "/meanstorisk/";
    
    if(hostname == "localhost")
        url = "meanstorisk/test_data.json";
    
    $.ajax({
        type: "POST",
        url: url,
        timeout: 15000,
        data: {
            option:1,
            spec:specificity_string, 
            prev: prevalence_string,
            datarowcount: numberOfRows,
            colcount: numberOfCols,
            unique_key: uniqueKey,
            graphkey:'CSV',
            dataCSV: valuesFromFile.join()
        },
        dataType: "json",
        success: set_data,
        error: ajax_error
    });
}
function make_ajax_call_standard_calculation() {
    //alert(cases_string + "\n" + controls_string + "\n" + specificity_string + "\n" + prevalence_string);
    uniqueKey = (new Date()).getTime();	
    hostname = window.location.hostname;
    url = "http://" + hostname +"/" + rest + "/meanstorisk/";
    
    if(hostname == "localhost")
        url = "meanstorisk/test_data.json";
    
    $.ajax({
        type: "POST",
        url: url,
        timeout: 15000,
        data: {
            option:2,
            spec:specificity_string, 
            prev: prevalence_string, 
            cases: cases_string, 
            controls: controls_string, 
            unique_key: uniqueKey,
            graphkey:'input'
        },
        dataType: "json",
        success: set_data,
        error: ajax_error
    });
}

function make_excel_call_user_defined_calculation() {
    //alert(cases_string + "\n" + controls_string + "\n" + specificity_string + "\n" + prevalence_string);
    uniqueKey = (new Date()).getTime();	
    hostname = window.location.hostname;
    url = "http://" + hostname +"/" + rest + "/meanstorisk/";
    
    if(hostname == "localhost")
        url = "meanstorisk/test_data.json";
    
    $.ajax({
        type: "POST",
        url: url,
        timeout: 15000,
        data: {
            option:3,
            spec:specificity_string, 
            prev: prevalence_string,
            datarowcount: numberOfRows,
            colcount: numberOfCols,
            unique_key: uniqueKey,
            graphkey:'CSV',
            dataCSV: valuesFromFile.join()
        },
        dataType: "json",
        success: set_excel,
        error: ajax_error
    });
}

function make_excel_call_standard_calculation() {
    //alert(cases_string + "\n" + controls_string + "\n" + specificity_string + "\n" + prevalence_string);
    uniqueKey = (new Date()).getTime();	
    hostname = window.location.hostname;
    url = "http://" + hostname +"/" + rest + "/meanstorisk/";
    
    if(hostname == "localhost")
        url = "meanstorisk/test_data.json";
    
    $.ajax({
        type: "POST",
        url: url,
        timeout: 15000,
        data: {
            option:4,
            spec:specificity_string, 
            prev: prevalence_string, 
            cases: cases_string, 
            controls: controls_string, 
            unique_key: uniqueKey,
            graphkey:'input'
        },
        dataType: "json",
        success: set_excel,
        error: ajax_error
    });
}

function set_data(dt) {
    //	alert ("Success");
    $("#please_wait_calculate").modal("hide");
    $("#download_button").removeClass("hide");
    set_values_table(dt);
    create_tabbed_table(dt);
    draw_graph();
}

function set_excel(dt) {
    $("#please_wait_download").modal("hide");

    //	alert ("Filename: " + dt);
    if(dt.length > 0)
        window.open(dt);
    else
        alert("There was a problem generating or downloading the excel file.");
        console.log("problem generating excel file");
        
    //	$("#download_link").attr("href", dt);
}

function ajax_error(dt) {
    alert("There was some problem getting the data. " + JSON.stringify(dt) ); 	
}

function set_values_table(dt) {

    values = dt.Delta;

    // First the input values
    if (values[0].Cases) set_value("#mean_cases",values[0].Cases.toPrecision(2)); else set_value("#mean_cases","");
    if (values[0].Controls) set_value("#mean_controls",values[0].Controls.toPrecision(2));	else set_value("#mean_controls","");
    if (values[0].Overall) set_value("#mean_overall",values[0].Overall.toPrecision(2) ); else set_value("#mean_overall","");


    if (values[1].Cases) set_value("#stderr_cases",values[1].Cases.toPrecision(4));	else set_value("#stderr_cases","");
    if (values[1].Controls) set_value("#stderr_controls",values[1].Controls.toPrecision(4)); else set_value("#stderr_controls","");
    if (values[1].Overall) set_value("#stderr_overall",values[1].Overall.toPrecision(4)); else set_value("#stderr_overall","");

    if (values[2].Cases) set_value("#N_cases",values[2].Cases); else set_value("#N_cases","");
    if (values[2].Controls) set_value("#N_controls",values[2].Controls);	else set_value("#N_controls","");
    if (values[2].Overall) set_value("#N_overall",values[2].Overall); else set_value("#N_overall","");

    if (values[3].Cases) set_value("#deviation_cases",values[3].Cases.toPrecision(4)); else set_value("#deviation_cases","");
    if (values[3].Controls) set_value("#deviation_controls",values[3].Controls.toPrecision(4) ); else set_value("#deviation_controls","");
    if (values[3].Overall) set_value("#deviation_overall",values[3].Overall.toPrecision(4) );else set_value("#deviation_overall","");

    if (values[4].Cases) set_value("#variance_cases",values[4].Cases.toPrecision(4) ); else set_value("#variance_cases","");
    if (values[4].Controls) set_value("#variance_controls",values[4].Controls.toPrecision(4)); else set_value("#variance_controls","");
    if (values[4].Overall) set_value("#variance_overall",values[4].Overall.toPrecision(4) ); else set_value("#variance_overall","");

    if (values[5].Cases) set_value("#cv_cases",values[5].Cases.toPrecision(4) ); else set_value("#cv_cases","");
    if (values[5].Controls) set_value("#cv_controls",values[5].Controls.toPrecision(4)); else set_value("#cv_controls","");
    if (values[5].Overall) set_value("#cv_overall",values[5].Overall.toPrecision(4) ); else set_value("#cv_overall","");

    if (values[6].Overall) set_value("#diff_overall",values[6].Overall.toPrecision(4) ); else set_value("#diff_overall","");

    if (values[7].Overall) set_value("#delta_overall",values[7].Overall.toPrecision(4) ); else set_value("#delta_overall","");

    if (values[8]&& values[8].Overall) set_value("#auc_overall",values[8].Overall.toPrecision(4) ); else set_value("#auc_overall","");
}

function create_tabbed_table(dt) {
    //	var jsonString;
    //	for (property in dt) {
    //  		jsonString = dt[property];
    //	}	
    //	var jsonObject = $.parseJSON(jsonString);
    //	alert("DT:[" + jsonObject + "]" );

    make_tabs();

    set_matrix("tab-1", 'PPV', 'Risk of Disease after a POSITIVE Test', 'Positive Predictive Value (PPV)', 
               dt['Sensitivity Given Specificity'], dt.PPV);	
    set_matrix("tab-2", 'cNPV', 'Risk of Disease after a NEGATIVE Test', 'Complement of the Negative Predictive Value (cNPV)', 
               dt['Sensitivity Given Specificity'], dt.cNPV);	
    set_matrix("tab-3", 'PPVmcNPV', 'Range of Risk after Test Results', 'PPV &minus; cNPV', 
               dt['Sensitivity Given Specificity'], dt['PPV-cNPV']);	
    set_matrix("tab-4", 'ProgramBased', '# of Cases Detected per 1000 People Screened', 'Program &minus; Based', 
               dt['Sensitivity Given Specificity'], dt['Program-Based']);	
    set_matrix("tab-5", 'PPV', '# of Cases Detected per 1000 Who are Screen Positive', 'PPV &minus; Based', 
               dt['Sensitivity Given Specificity'], dt['PPV-Based']);	
    set_matrix("tab-6", 'Sens', '# of Cases Detected per 1000 With Disease', 'Sensitivity &minus; Based', 
               dt['Sensitivity Given Specificity'], dt['Sensitivity-Based']);	
    set_matrix("tab-7", 'DominatedByRareDisease', '# Per 1000 Screenees Who Screen Positive', 'Dominated by Specificity for Rare Disease', 
               dt['Sensitivity Given Specificity'], dt['Dominated by Specificity for a Rare Disease']);	

}

function make_tabs() {
    tabs = $("<div id='tabs' style='width:1180px;margin:5px;'> </div>");
    $(".tabbed_output_panel").empty().append(tabs);
    tab_names = $("<UL> </UL>");
    tabs.append(tab_names);

    var index = 0;
    for(var key in ppv_tabs) {
        index++;
        tab_names.append("<LI><a  style='padding:3px;' href='#tab-" + index + "' title='" + ppv_tabs[key] + "'>" + key + "</a></LI>");
        tabs.append("<DIV style='width:1180px;height:325px;' id='tab-" + index + "' > " + ppv_tabs[key] + " </div>"); 
    }

    tabs.tabs();

}

function set_matrix(tab_id, type, table_name, table_second_name, sensitivity_matrix, matrix) {
    var prevalence_values = Object.keys(matrix[0]);
    var prevalence_count = prevalence_values.length;
    var specificity_count = matrix.length;


    var general_table = $("<TABLE class='table_data' style='width:94%;'></TABLE>");
    $("#"+tab_id).empty().append(general_table);

    var first_header_row = $("<tr></tr>");	
    first_header_row.append("<TH class='table_data header' colspan='" +  (prevalence_count + 4) + 
                            "'>" + table_name + "</TH>");
    first_header_row.appendTo(general_table);

    var second_header_row = $("<tr></tr>");	
    second_header_row.append("<TH class='table_data " + type + "_stripe' colspan='" +  (prevalence_count + 4) + "'><div class='define' id='" + type + tab_id+"' data-term='"+type+"'>" + table_second_name + "</div><div class='popupDefinition' id='" + type +tab_id+ "Definition'></div></TH>");
    second_header_row.appendTo(general_table);

    var third_header_row = $("<tr></tr>");	
    third_header_row.append("<TH class='table_data header' colspan='4' style='border-right:1px solid black;'>" +
                            "<div class='define' id='Sens2-" + tab_id +
                            "' data-term='Sens'>Sensitivity Given Specificity <br /> for Given Delta </div>                         </TH>" );
    third_header_row.append("<TH class='table_data header' colspan='" + prevalence_count + "' >" +
                            "<div class='define' id='DP2-" + tab_id + 
                            "' data-term='DP'>Disease Prevalence</div>" +
                            "<div class='popupDefinition' id='DP2-" + 
                            tab_id + "Definition'></div></TH>");
    third_header_row.appendTo(general_table);

    var header_row = $("<tr></tr>");
    header_row.attr('id', type + '_table_row_header');
    header_row.append("<TH class='table_data header'><div class='define' id='Spec-"+tab_id+"' data-term='Spec'>Specificity</div><div class='popupDefinition' id='Spec-"+tab_id+"Definition'></div></TD>");
    header_row.append("<TH class='table_data header'><div class='define' id='Sens-"+tab_id+"' data-term='Sens'>Sensitivity</div><div class='popupDefinition' id='Sens-"+tab_id+"Definition'></div></TD>");
    header_row.append("<TH class='table_data header'><div class='define' id='LRP-"+tab_id+"' data-term='LRP'>LR+</div><div class='popupDefinition' id='LRP-"+tab_id+"Definition'></div></TD>");
    header_row.append("<TH class='table_data header' style='border-right:1px solid black;'><div class='define' id='LRN-"+tab_id+"' data-term='LRN'>LR-</div><div class='popupDefinition' id='LRN-"+tab_id+"Definition'></div></TD>");
    for (var x=0;x<prevalence_count;x++) {
        header_row.append("<TH class='table_data header'>" + format_number(prevalence_values[x]) + "</TD>");
    }
    header_row.appendTo(general_table);

    for (var y=0;y < specificity_count;y++) {
        var row = $("<tr></tr>");
        // First do the specificity
        row.attr('id', type + '_table_row_' + x);
        row.append("<TD class='table_data col1'>" + format_number(sensitivity_matrix[y].Specificity) + "</TD>");
        row.append("<TD class='table_data col1'>" + format_number(sensitivity_matrix[y].Sensitivity) + "</TD>");
        row.append("<TD class='table_data col1'>" + format_number(sensitivity_matrix[y]['LR+']) + "</TD>");
        row.append("<TD class='table_data col1' style='border-right:1px solid black;'>" + 
                   format_number(sensitivity_matrix[y]['LR-']) + "</TD>");



        // Then do prevalence
        for (x=0;x<prevalence_count;x++) {
            var prevalence_value = prevalence_values[x];
            row.append("<TD class='table_data col1'>" + format_number(matrix[y][prevalence_value]) + "</TD>");			
        }
        row.appendTo(general_table);
    }	
    //from glossary.js for term definition popup in the output
    general_table.find('.define').on('click', termDisplay);
}

function draw_graph() {
//    url = "http://" + hostname +"/meanstorisk/";
    var activePanelIndex = thisTool.find("#accordion .collapse .in").index();
    if (activePanelIndex === 0) {
        graph_file = "tmp/CSV"+uniqueKey+".png?";
    } else {
        graph_file = "tmp/input"+uniqueKey+".png?";

    }

    $(".graph_panel").empty().append("<IMG alt='graph' class='output_graph' src='" + graph_file+"'/>");
}

function set_value(field, value) {
    $(field).text("" + value);
    $(field).addClass('highlight');
    setTimeout(
        function() { $(field).removeClass('highlight'); }, 
        2000
    );		
}

function format_number(num) {
    //	var intermediate = new Number(num.toPrecision(3));
    //	if (num < 100 && num > 0.001) return intermediate.toString();
    //	else return intermediate.toExponential();
    return num;
}

function reset(){
    var fileControl = thisTool.find("input#input_file_upload");
    thisTool.find("input").val("");
    thisTool.find("input#specificity").val("0.8, 0.9, 0.95, 0.99, 0.999");
    thisTool.find("input#prevalence").val("0.1, 0.05, 0.01, 0.005, 0.001");
    
    thisTool.find(".table_panel .table_data, .tabbed_output_panel, .graph_panel").html("");
}
thisTool.find("#reset").on("click", reset);
//  Below is needed for IE 9 and below and compatibility mode as the older version does not support the Object.keys method

Object.keys = Object.keys || function(o) { 
    var result = []; 
    for(var name in o) { 
        if (o.hasOwnProperty(name)) 
            result.push(name); 
    } 
    return result; 
};