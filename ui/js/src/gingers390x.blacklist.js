/*
 * Project Ginger S390x
 *
 * Copyright IBM, Corp. 2015
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
gingers390x.initBlacklist = function(){
    		var opts = {

    	    		inputLabel : 'Remove From Blacklist:',
    	    		inputPlaceholder : 'Enter Blacklisted Device IDs',
    	    		actionName : 'Remove',
    	    		helpText: 'Comma seperated device ids/range in #.##.#### format.',
    	    		noteText: 'Note * Removing the device from blacklist will add the device to offline devices'

    		};
    		gingers390x.createBlPanel(opts,gingers390x.removeFromBlackList);
    	}

gingers390x.createBlPanel = function(opts, actionCallBack){

    		var inputLabel = opts.inputLabel;
    		var inputPlaceholder = opts.inputPlaceholder;
    		var actionName = opts.actionName;
    		var helpText = opts.helpText;
    		var noteText = opts.noteText;


    		var alertHtml = ["<span id='alert-modal-container' style='display: none;'></span>"].join('');
    		$(alertHtml).appendTo("#blacklist-content-container");

    		var formHtml = ["<form class='form-inline' role='form' id='form-blacklist-remove'>" ,
    		        			"<div class='form-group'>" ,
    		        				"<label class='sr-only' for='device'> "+inputLabel+" </label>" ,
    		        					"<input type='text' id='devices' name='devices' placeholder='" + inputPlaceholder + "' class='form-control'>",
    		        					"<button aria-expanded='false' type='submit' class='btn btn-primary' id='button-blacklist-remove' >" ,
    		        					"<i class='fa fa-minus-circle'></i> "+actionName+" </button>",
    		        			"</div>" ,
    		        		"</form>"].join(' ');
    		$(formHtml).appendTo("#blacklist-content-container");

    		var removeForm = $('#form-blacklist-remove');
    		var submitButton = $('#button-blacklist-remove');
    		removeForm.on('submit', actionCallBack);
    		submitButton.on('click', actionCallBack);

    		var helpHtml = ["<p class='help-block'>",
    		                "<i class='fa fa-info-circle'></i>",
    		                helpText,
    		                "</p>"].join(' ');

    		var noteHtml = ["<p>",
    		                noteText,
    		                "</p>"].join('');

    		$(helpHtml).appendTo("#blacklist-content-container");
    		$(noteHtml).appendTo("#blacklist-content-container");
    	};

    	 gingers390x.removeFromBlackList = function(event){

    	    	var formData = $('#button-blacklist-remove').serializeObject();

    	    	var taskAccepted = false;
    	        var onTaskAccepted = function() {
    	            if(taskAccepted) {
    	                return;
    	            }
    	            taskAccepted = true;
    	            wok.topic('gingerbase/debugReportAdded').publish();

    	        };

    	        gingers390x.removeBlacklist(formData, function(result) {
    	            onTaskAccepted();
    	            var successText = result['message'];
    	            gingers390x.messagecloseable.success(successText,'#alert-modal-container');
    	            wok.topic('gingerbase/debugReportAdded').publish();
    	        }, function(result) {
    	            // Error message from Async Task status
    	            if (result['message']) {
    	                var errText = result['message'];
    	            }
    	            // Error message from standard gingers390x exception
    	            else {
    	                var errText = result['responseJSON']['reason'];
    	            }
    	            result && gingers390x.messagecloseable.error(errText,'#alert-modal-container');

    	            taskAccepted;

    	        }, onTaskAccepted);

    	        event.preventDefault();
    	    };
