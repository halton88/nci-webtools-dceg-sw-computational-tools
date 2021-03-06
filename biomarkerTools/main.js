if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, "");
  };
}

var default_ajax_error;
var rest = "biomarkerToolsRest";
var activeRequest = false;
var custom_po_tmpl = "<div class='popover' role='tooltip'><div class='arrow'></div><h3 class='popover-title'></h3><div class='popover-content'></div></div>";

function disableAll(){
 
  activeRequest = true;
  $("a, button,select,input").attr("disabled","").addClass("disable_control");

 
  $("[data-toggle='tab']").attr("data-toggle", "disabledTab");
  $("[data-toggle='collapse']").attr("data-toggle", "disabledCollapse");
}

function enableAll() {
 
  activeRequest = false;
  $("a, button, select, input").removeAttr("disabled").removeClass("disable_control");
  $(".disable_control").unbind("click");

 
  $("[data-toggle='disabledTab']").attr("data-toggle", "tab");
  $("[data-toggle='disabledCollapse']").attr("data-toggle", "collapse");
}

function generateUniqueKey(){
  Math.seedrandom();
  var multiples = [100, 1000, 10000, 100000, 1000000, 10000000,100000000, 1000000000];
  var randomKey = Math.floor(Math.random() * multiples[Math.floor(Math.random() * multiples.length)]);

  return randomKey;
}

$(document).ready(function(){
  this.title = "Biomarker Tools: Home";
});

$(document).on('hide.bs.tab', function (e) {
  var id = e.relatedTarget.hash;
  var currentTab = id.toString().replace('#', '');
 
  if(currentTab != "home" && currentTab != "help")
    thisTool = $(id);
});

$(document).on('shown.bs.tab', function (e) {
  if(e.target.hash !== undefined){
    var id = e.target.hash.toString().replace('#', '');
    if (id != 'home')
      require([ id ]);
  }
});

$('#contentTabs .nav-tabs').on('show.bs.tab', function(el){
  var id = el.target.hash.toString().replace('#', '');
  if (id != 'home')
    require([id]);
  var title = "Biomarker Tools: " + el.target.text;
  document.title = title;
});

$(document).on('click touchstart keydown', '.define', termDisplay).on('focus', function() {
    $(this).trigger('mouseover');
  }).on('blur', function() {
    $(this).trigger('mouseout');
  });

$('.disable_control').on('click',function(e){
  e.preventDefault();
});

$('.goToGlossary').on('click', function(el){
  var id = el.target.hash;
  var $this = this;

  $(".nav a[href='#help']").tab('show');
  $(".nav a[href='#help']").on('shown.bs.tab', function(){
    document.getElementById("header-glossary").scrollIntoView(true);
  });

});

$('.goToHelp').on('click', function(el){
  var $this = this;
  $(".nav a[href='#help']").tab('show');
  $(".nav a[href='#help']").on('shown.bs.tab', function(){
    var selector = $($this).attr('href').toString().replace("#","");
    document.getElementById(selector).scrollIntoView(true);
  });
});

$('.goToTab').on('click', function(el){
  el.preventDefault();
  var ref = $(this).attr('href');
  $('.nav li.active').removeClass('active');
  $(".nav a[href='" + ref + "']").tab('show').parent().addClass('active');
  var id = ref.replace("#","");
  if (id != 'home')
    require([id]);
});


function goToTarget(tar) {
  document.getElementById(tar.hash.replace("#","")).scrollIntoView(true);
}


function default_ajax_error(request, status, error){
  var logError;
  try {
    logError = JSON.parse(request.responseText).error;
  } catch (e) {
    logError = error;
  }
  display_errors([logError]);
}

function isNumberBetweenZeroAndOne(n) {
  if(isNaN(n))
    return false;
  if (isNaN(parseFloat(n)))
    return false;
  if (n >= 1)
    return false;
  if (n <= 0)
    return false;
  return true;
}

function isInt(n){
  return Number(n) == n && n % 1 === 0;
}

function display_errors(message) {
  var text = "";

  if ($.isArray(message) && message.length > 0) {
    $(message).each(function (i, v) {
      text += "<li>" + v + "</li>";
    });
  }
  if (typeof message == "string") {
    text = message;
  }
  if(thisTool.find('#errors').length > 0){
    thisTool.find("#errors").empty().remove();
  }

  thisTool.find("#helpGlossaryLinks").after("<div id='errors' class='alert alert-danger fade in'>" +
                        "<ul class='list-unstyled'>" + text + "</ul></div>");

  thisTool.find('#errors').fadeIn();
  document.querySelector('header').scrollIntoView(true);
}
