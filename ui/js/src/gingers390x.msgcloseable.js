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
gingers390x.messagecloseable = function(msg, level, node) {
	//This will only work if .window class is not present in any tag
    //as wok.main.js has js to close full window on .close click
    "use strict";
    var message = ["<div role='alert' class='alert alert-dismissible " + level +" fade in'>",
    	           "<button type='button' class='close' data-hide='alert' aria-label='Close'><span aria-hidden='true'><i class='fa fa-times-circle'></i></span></button>",
    	           msg,
    	           "</div>"].join('');
    $(message).appendTo(node)
    $(node).show();
    $("[data-hide]").on("click", function(){
    	$(this).closest("." + $(this).attr("data-hide")).hide();
    });

};

gingers390x.messagecloseable.warn = function(msg, node) {
    "use strict";
    gingers390x.messagecloseable(msg, 'alert-warning', node); 
};
gingers390x.messagecloseable.error = function(msg, node) {
    "use strict";
    gingers390x.messagecloseable(msg, 'alert-danger', node);
};
gingers390x.messagecloseable.error.code = function(code) {
    "use strict";
    var msg = code + ": " + i18n[code];
    gingers390x.messagecloseable(msg, 'alert-danger');
};
gingers390x.messagecloseable.success = function(msg, node) {
    "use strict";
    gingers390x.messagecloseable(msg, 'alert-success', node);
};
