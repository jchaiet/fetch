import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

/**
 * getURL
 * Take url string and a query object to produce a query string 
 * to fetch using the URI library.
 * @param {String} url 
 * @param {Object} query 
 * @returns {String} URL string to be used in fetch request
 */
function getURL(url, query){
  var uri = new URI(url);
  return uri.setQuery(query);
}

/**
 * retrieve
 * Refine parameters to include options necessary to 
 * request data from the /records endpoint
 * @param {Object} params 
 */
function retrieve(params){
  return new Promise((resolve, reject) => {
    //Build fetch query options
    let limit = 11;
    let options = {};

    if(params){
      options = {
        "color[]": params.colors === undefined ? [] : params.colors,
        page: params.page === undefined ? 1 : params.page,
        limit,
        offset: params.page === undefined ? 0 : (params.page - 1) * (limit - 1) 
      }
    }else{
      options = {
        "color[]": [],
        page: 1,
        limit,
        offset: 0
      }
    }

    //Create query string using URI library
    let url = getURL(window.path, options);

    //Handle fetch
    handleFetch(url)
    .then(response => {
      resolve(handleTransformData(response, options.page))
    })
    .catch(error => {
      reject(error)
    })
  }) 
}

/**
 * handleFetch
 * Fetch and return data from endpoint
 * @param {String} url 
 * @returns {Array} Array of objects containing request data
 */
function handleFetch(url){
  return fetch(url)
  .then(response => { 
    return response.json()
    .then(data => {
      //Check response and make use of JSON data 
      //instead of json() Promise
      if(!response.ok){
        return Promise.reject(data);
      }else{
        return data;
      }
    });
  })
  .catch(error => {
    return new Error(error);
  });
}

/**
 * handleTransformData
 * Transform fetched data into an object
 * @param {*} data 
 * @param {*} page 
 * @typedef {Object} finalObj
 * @property {Array} ids Contains ids of all items returned from the request
 * @property {Array} open Contains all items returned from the request that have a disposition value of "open"
 * @property {Number} closedPrimaryCount Total number of items returned from the request that have a disposition value of "closed" and contain a primary color
 * @property {Number} previousPage The page number of the previous page of results
 * @property {Number} nextPage The page number of the next page of results
 * @returns {finalObj} Object with following keys: ids[], open[], closedPrimaryCount, previousPage, nextPage
 */
function handleTransformData(data, page){
  try {
    let finalObj = {
      ids: [],
      open: [],
      closedPrimaryCount: 0
    }

    //Set nextPage and previousPage values
    if(data.length === 0 && page === 1){
      finalObj.nextPage = null;
      finalObj.previousPage = null;     
    }else{

      if(page === 1){
        finalObj.previousPage = null;
      }else{
        finalObj.previousPage = page - 1;
      }

      if(data.length > 10){
        finalObj.nextPage = page + 1;
        data.pop();
      }else{
        finalObj.nextPage = null;
      }
    }

    //Remove the last item of the data array
    data.forEach(item => {
      //Check if item color is Primary and set isPrimary
      if(item.color === 'red' || item.color === 'blue' || item.color === 'yellow'){
        item.isPrimary = true;
      }else{
        item.isPrimary = false;
      }

      //Add open items to ids array
      finalObj.ids.push(item.id);
      if(item.disposition === 'open'){
        finalObj.open.push(item);
      }

      //Check if item is a primary color and is also closed
      if(item.disposition === 'closed' && (item.color === 'red' || item.color === 'blue' || item.color === 'yellow')){
        finalObj.closedPrimaryCount++
      }
    });
    
    return finalObj;
    
  }catch(error){
    console.log('There was an error', error);
  }
}

export default retrieve;
