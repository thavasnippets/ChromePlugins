document.addEventListener('DOMContentLoaded',function(){

    var checkPageButton= document.getElementById('checkPageFrsh');
    var deleteCacheButton= document.getElementById('deleteMemory');
    var radios =  document.querySelectorAll('input[type=radio][name="optradio"]');
    var typeQry='';
    var isToken=false;
    var age='';
    var queryMode='';
    var slot='';
    
    const sleep=(milliseconds)=>{
        return new Promise(resolve=> setTimeout(resolve,milliseconds*1000));
    }

    Array.prototype.forEach.call(radios,function(radio){
        radio.addEventListener('change',queryTyp);
    });

  

    function queryTyp(event){
        typeQry=this.value;
    }



    if(deleteCacheButton != null){        
        deleteCacheButton.addEventListener('click',function(){
            chrome.storage.sync.set({"cowinDOM":"0,0"},function(){
                alert('Filter Cleared!');
            });
        });        
    }
    if(checkPageButton != null){
        
        checkPageButton.addEventListener('click',function(){
            var value='';
            var err=false;
            value=typeQry+','+$('#ddlAge').val();

                if($('#ddlAge').val()=='0'){
                    err=true;
                }
               
            if($('#ddlSlot').val()=="0" || 
            $('#txtTimeout').val()<1 || 
            $('#txtTimeout').val()==''  ){
                err=true;
            }
                value+=(','+$('#ddlSlot').val());
                value+= (','+($('#txtTimeout').val()));
            if(!err){          
            
            chrome.storage.sync.set({"cowinDOM":value},function(){
                  
                 chrome.runtime.reload();
                 checkNotification();
            });
            }
            else{
                alert("Fill the form!");
            }
        });        
    }

function getDOM18(){
    if(document.getElementsByClassName('pin-search-btn') != null && 
    document.getElementsByClassName('pin-search-btn').length>0){
    document.getElementsByClassName('pin-search-btn')[0].click();
    }
    if(document.getElementById('flexRadioDefault2') != null){
        document.getElementById('flexRadioDefault2').click();
    }
    if(document.getElementById('c1') != null){
        document.getElementById('c1').click();
    }
    return document.body.innerHTML;
}

function getDOM45(){
    if(document.getElementsByClassName('pin-search-btn') != null && 
    document.getElementsByClassName('pin-search-btn').length>0){
    document.getElementsByClassName('pin-search-btn')[0].click();
    }
    if(document.getElementById('flexRadioDefault3') != null){
        document.getElementById('flexRadioDefault3').click();
    }
    if(document.getElementById('c2') != null){
        document.getElementById('c2').click();
    }
    return document.body.innerHTML;
}

function getAvailableCenters(dom,slot,timeout){
    var doseAvailable= $(dom).find('.dosetotal span');
    var availableCenters=[];
    if(doseAvailable.length>0){
        for(var child of doseAvailable){
            if(child.innerHTML.split(":")[0].trim()== slot && child.innerHTML.split(":")[1].trim()>0){
                availableCenters.push(child.closest(".row.ng-star-inserted").querySelector("* > .center-name-title").innerHTML + ":-"+
                child.closest(".row.ng-star-inserted").querySelector("* > .center-name-text").innerHTML);
            }
        }
    }
    else{
        doseAvailable= $(dom).find('.vaccine-box > a');
        for(var child of doseAvailable){
            if(child.innerText.trim() !='Booked' && child.innerText.trim() !='NA'){
                availableCenters.push(child.closest(".mat-list-text").querySelectorAll(".center-name-title")[0].innerText + ":-"+
                child.closest(".mat-list-text").querySelectorAll(".center-name-text")[0].innerText );
            }
        }
    }

    if(availableCenters.length>0){
        let url=chrome.runtime.getURL('note.mp3');
        let alaram= new Audio(url);
        let playPromise= alaram.play();
        if(playPromise !== undefined){
            playPromise.then(function(){
                condFlag= confirm(availableCenters.toString());
                if(!condFlag){
                    sleep(timeout).then(()=>{
                        checkNotification();
                    });
                }
            }).catch(function(error){console.log(error);});
        }
    }
    else{
        sleep(timeout).then(()=>{
            checkNotification();
        });
    }
}

    function checkNotification(){
        chrome.storage.sync.get(["cowinDOM"],function(items){
            if(!jQuery.isEmptyObject(items)){
                var data=items.cowinDOM.split(',');
                 queryMode=data[0];
                age=data[1];                
                slot=data[2];
                var timeout=data[3];
                if(age>0 && queryMode !=='' && timeout !='' && timeout>1 ){
                  if(age=='18'){
                      chrome.tabs.executeScript({
                          code:'('+getDOM18+')();'  
                      },(results)=>{
                          if(results== null){
                              checkNotification();
                          }else{
                              getAvailableCenters(results[0],slot,timeout);
                          }
                      });
                  }
                  else{
                    chrome.tabs.executeScript({
                        code:'('+getDOM45+')();'  
                    },(results)=>{
                        if(results== null){
                            checkNotification();
                        }else{
                            getAvailableCenters(results[0],slot,timeout);
                        }
                    });
                  }
                }
            }
        }); 
    }

    checkNotification();

   
      
},false);

