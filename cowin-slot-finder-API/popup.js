document.addEventListener('DOMContentLoaded',function(){

    var checkPageButton= document.getElementById('checkPage');
    var deleteCacheButton= document.getElementById('deleteMemory');
    var ddlstate= document.getElementById('ddlState');
    var radios =  document.querySelectorAll('input[type=radio][name="optradio"]');
    var brrradios =  document.querySelectorAll('input[type=radio][name="optBrr"]');
    var typeQry='dist';
    var isToken=false;

    $('#trPin').hide();
    $('#trState').show();
    $('#trDist').show();
    $('#trBrr').hide();
    const sleep=(milliseconds)=>{
        return new Promise(resolve=> setTimeout(resolve,milliseconds));
    }

    Array.prototype.forEach.call(radios,function(radio){
        radio.addEventListener('change',queryTyp);
    });
    Array.prototype.forEach.call(brrradios,function(radio){
        radio.addEventListener('change',brrTyp);
    });

    function brrTyp(event){
        if(this.value==='Y'){
            isToken=true; 
            $('#trBrr').show();
            $('#txtBrr').val('');
           
        }
        else{
            isToken=false;             
            $('#trBrr').hide();
            $('#txtBrr').val('');
        }
    }

    function queryTyp(event){
        if(this.value==='pin'){
            typeQry='pin'; 
            $('#trPin').show();
            $('#trState').hide();
            $('#trDist').hide(); 
        }
        else{
            typeQry='dist'; 
            $('#trPin').hide();
            $('#trState').show();
            $('#trDist').show();  
        }
    }

    function loadStates(){
        $.ajax({
            url:"https://cdn-api.co-vin.in/api/v2/admin/location/states",
            dataType:'json',
            success: function(data){
                var state= data.states;
                $('#ddlState option').remove();
                $('#ddlState').append('<option value="0" selected> Select the state</option>');
                $.each(state,function(data,value){
                    $('#ddlState').append($('<option></option>').val(value.state_id).html(value.state_name));
                });
            },
            error: function(e){}
        });
    }

    if(ddlstate != null){
        loadStates();
        ddlstate.addEventListener('change',function(){
            var stateId=this.value;
            $.ajax({
                url:"https://cdn-api.co-vin.in/api/v2/admin/location/districts/"+stateId,
                dataType:'json',
                success: function(data){
                    var dist= data.districts;
                    $('#ddlDist option').remove();
                    $('#ddlDist').append('<option value="0" selected> Select the District</option>');
                    $.each(dist,function(data,value){
                        $('#ddlDist').append($('<option></option>').val(value.district_id).html(value.district_name));
                    });
                },
                error: function(e){}
            });
        });        
    }

    if(deleteCacheButton != null){        
        deleteCacheButton.addEventListener('click',function(){
            chrome.storage.sync.set({"cowin":"dist,0,0,0,"},function(){
                alert('Filter Cleared!');
            });
        });        
    }
    if(checkPageButton != null){
        
        checkPageButton.addEventListener('click',function(){
            var value='';
            var err=false;
            value=typeQry+','+$('#ddlAge').val()+",";
            if(typeQry==='pin'){
                if($('#txtPincode').val()===""|| $('#txtPincode').val().length != 6){
                    err=true;
                }
                value+=$('#txtPincode').val();
            }
            else{
                if($('#ddlDist').val()===""|| $('#ddlDist').val().length == 0){
                    err=true;
                }
                value+=$('#ddlDist').val();
            }
            
            if($('#ddlSlot').val()=="0"){
                err=true;
            }
                value+=(','+$('#ddlSlot').val());
            if(isToken){
                if($('#txtBrr').val().trim()===""){
                    err=true;
                }
            }
                value+=(','+$('#txtBrr').val().trim());
            
            if(!err){          
            
            chrome.storage.sync.set({"cowin":value},function(){
                  alert('You will get notified!');
                 //checkNotification();
                 chrome.runtime.reload();
            });
            }
            else{
                alert("Fill the form!");
            }
        });        
    }

    function checkNotification(){
        chrome.storage.sync.get(["cowin"],function(items){
            if(!jQuery.isEmptyObject(items)){
                var isTempComplete=false;
                var isFirstTemp=true;
                var data=items.cowin.split(',');
                var queryMode=data[0];
                var age=data[1];
                var quey=data[2];
                var slot=data[3];
                var brr=data[4];
                var condFlag=false;
                if(age>0 && quey>0 && queryMode !==''){
                    var today= new Date();
                    var date= today.getDate()+'-'+(today.getMonth()+1)+'-'+today.getUTCFullYear();
                    if(isFirstTemp || isTempComplete){
                        isTempComplete=false;
                        isFirstTemp=false;
                        var url='';
                        if(brr==''){
                            url='https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/';
                        }
                        else{
                            url='https://cdn-api.co-vin.in/api/v2/appointment/sessions/';
                        }
                        if(queryMode=='dist'){
                            url+=("calendarByDistrict?district_id="+quey+"&date="+date);

                        }
                        else{
                            url+=("calendarByPin?pincode="+quey+"&date="+date);
                        }
                        if(brr==''){
                            $.ajax({
                                url:url,
                                dataType:'json',
                                success: function(data){
                                var isAvailable=[];
                                let result=data['centers'];
                                $.each(result,function(idx,obj){
                                    let session=obj.sessions;
                                    $.each(session,function(idx2,objsession){
                                        if(objsession.available_capacity>0 && objsession.min_age_limit==age){
                                            if((slot=="1" && objsession.available_capacity_dose1>0)
                                            || (slot=="2" && objsession.available_capacity_dose2>0) )
                                            isAvailable.push(obj.name+':-'+obj.address);
                                        }
                                    });
                                });

                                if(isAvailable.length>0){
                                    let url=chrome.runtime.getURL('note.mp3');
                                    let alaram=new Audio(url);
                                    var playPromise=alaram.play();
                                    if(playPromise !== undefined){
                                        playPromise.then(function(){
                                            condFlag=confirm(isAvailable.toString());
                                        }).
                                        catch(function(error){console.log(error)});
                                    }
                                   
                                }
                                },
                                error: function(e){},
                                complete:function(e){
                                    if(!condFlag){
                                        sleep(50000).then(()=>{
                                            checkNotification();
                                        });
                                        
                                    }
                                }
                            });
                        }
                        else{
                            let token=brr.toString().replace('Bearer','').toString().trim();
                            token='Bearer '+token;
                            $.ajax({
                                url:url,
                                dataType:'json',
                                headers:{'Authorization': token},
                                success: function(data){
                                var isAvailable=[];
                                let result=data['centers'];
                                $.each(result,function(idx,obj){
                                    let session=obj.sessions;
                                    $.each(session,function(idx2,objsession){
                                        if(objsession.available_capacity>0 && objsession.min_age_limit==age){
                                            if((slot=="1" && objsession.available_capacity_dose1>0)
                                            || (slot=="2" && objsession.available_capacity_dose2>0) )
                                            isAvailable.push(obj.name+':-'+obj.address);
                                        }
                                    });
                                });

                                if(isAvailable.length>0){
                                    let url=chrome.runtime.getURL('note.mp3');
                                    let alaram=new Audio(url);
                                    var playPromise=alaram.play();
                                    if(playPromise !== undefined){
                                        playPromise.then(function(){
                                            condFlag=confirm(isAvailable.toString());
                                        }).
                                        catch(function(error){console.log(error)});
                                    }
                                    
                                }
                                },
                                error: function(e){},
                                complete:function(e){
                                    if(!condFlag){
                                        sleep(50000).then(()=>{
                                            checkNotification();
                                        });
                                    }
                                }
                            });
                        }
                    }
                }
            }
        }); 
    }

    checkNotification();

   
      
},false);

