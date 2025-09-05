const { defaults } = require("joi");
const Listing = require ("../models/listing");

const fetch = (...args) => import('node-fetch').then(({default: fetch})=>fetch(...args));
 
// const fetch = require('node-fetch');
const MAPTILER_API_KEY = process.env.MAP_TOKEN;
async function geocode(query) {
const url =`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_API_KEY}&limit=3`; 
  const response = await fetch(url);
  const data = await response.json();
  return data;
}




module.exports.index = async(req,res)=>{
    const allListings=await Listing.find({});
    // console.log(allListings);
    res.render("listings/index.ejs",{allListings});
};

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    if(!listing){
        req.flash("error"," Listing you requested for does not exist! ");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing});
};

module.exports.createListing = async(req,res)=>{
    let result = await geocode( req.body.listing.location,{
       limit:1,
    });

    let url = req.file.path;
    let filename = req.file.filename;

     const newListing = new Listing(req.body.listing);
     newListing.owner = req.user._id;
     newListing.image = { url,filename };
     newListing.geometry =  result.features[0].geometry;
     let savelisting=await newListing.save();
     console.log(savelisting);
     req.flash("success","New Listing Created!");
     res.redirect("/listings");
};

module.exports.renderEditForm =async (req,res)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id);
    if(!listing){
        req.flash("error"," Listing you requested for does not exist! ");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing = async (req,res)=>{
    let {id}=req.params;
    let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});
    
    if( typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url,filename };
     await listing.save();
    }

     req.flash("success","Listing Updated!");
     res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req,res)=>{
    let {id}=req.params;
    let deletedListing = await  Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};
