(function (window) {
    window.extractData = function () {
        var ret = $.Deferred();

        function onError() {
            console.log('Loading error', arguments);
            ret.reject();
        }

        function onReady(smart) {

            if (smart.hasOwnProperty('patient')) {

                var patient = smart.patient;
                var pt = patient.read();
                var obv = smart.patient.api.fetchAll({
                    type: /* [Insert FHIR resource type here] */,
                    query: {
                        code: {
                            $or: [
                                'http://loinc.org|8302-2',     // Height
                                'http://loinc.org|3137-7',     // Height [measured]
                                'http://loinc.org|3138-5',     // Height [stated]
                                'http://loinc.org|8308-9',     // Height [standing]
                                'http://loinc.org|8306-3',     // Height [lying]
                                'http://loinc.org|8301-4',     // Height [estimated]

                                'http://loinc.org|29463-7',    // Weight
                                'http://loinc.org|3141-9',     // Weight
                                'http://loinc.org|18833-4',    // Weight
                                'http://loinc.org|3142-7',     // Weight [stated]
                                'http://loinc.org|75292-3',    // Weight [usual]
                                'http://loinc.org|8335-2',     // Weight [estimated]
                                'http://loinc.org|8351-9',     // Weight [without clothes]
                            ]
                        }
                    }
                });

                $.when(pt, obv).fail(onError);

                $.when(pt, obv).done(function (patient, obv) {

                    var byCodes = smart.byCodes(obv, 'code');
                    var gender = patient.gender;
                    var fname = '';
                    var lname = '';

                    if (typeof patient.name[0] !== 'undefined') {
                        fname = patient.name[0].given.join(' ');
                        lname = patient.name[0].family.join(' ');
                    }

                    // Create arrays of JSON objects
                    var height = byCodes('8302-2', '3137-7', /* [Copy/paste remaining LOINC codes for height here] */);
                    var weight = byCodes('29463-7', '3141-9', /* [Copy/paste remaining LOINC codes for weight here] */);

                    // Set default patient object
                    var p = defaultPatient();

                    // Patient demographics
                    p.birthdate = patient.birthDate;
                    p.gender = gender;
                    p.fname = fname;
                    p.lname = lname;

                    // Height
                    p.height = getQuantityValueAndUnit(height[0]);
                    p.height = JSON.stringify(height[0]) // Delete this line when instructed

                    // Weight
                    p.weight = getQuantityValueAndUnit(weight[0]);

                    // Calculate BMI
                    // p.bmi = (getQuantityValue(weight[0]) / (Math.pow((getQuantityValue(height[0]) / 100), 2))).toFixed(1);

                    ret.resolve(p);

                });

            } else {
                onError();
            }
        }
        FHIR.oauth2.ready(onReady, onError);
        return ret.promise();
    };

    // Default patient parameters
    function defaultPatient() {

        return {
            fname: { value: '' },
            lname: { value: '' },
            gender: { value: '' },
            birthdate: { value: '' },
            height: { value: '' },
            weight: { value: '' },
            bmi: { value: '' },
        };
    }

    // Get numerical value and unit of observations 
    function getQuantityValueAndUnit(ob) {

        if (typeof ob != 'undefined' &&
            typeof ob.valueQuantity != 'undefined' &&
            typeof ob.valueQuantity.value != 'undefined' &&
            typeof ob.valueQuantity.unit != 'undefined') {

            return ob.valueQuantity.value.toFixed(1) + ' ' + ob.valueQuantity.unit;

        } else {
            return undefined;
        }
    }

    // Get only numerical value of observations
    function getQuantityValue(ob) {

        if (typeof ob != 'undefined' &&
            typeof ob.valueQuantity != 'undefined' &&
            typeof ob.valueQuantity.value != 'undefined') {

            return ob.valueQuantity.value;

        } else {
            return undefined;
        }
    }

    // Draw, show, or hide corresponding HTML on index page
    window.drawVisualization = function (p) {
        $('#holder').show();
        $('#loading').hide();
        $('#fname').html(p.fname);
        $('#lname').html(p.lname);
        $('#gender').html(p.gender);
        $('#birthdate').html(p.birthdate);
        $('#height').html(p.height);
        $('#weight').html(p.weight);
        $('#bmi').html(p.bmi);
    };

})(window);