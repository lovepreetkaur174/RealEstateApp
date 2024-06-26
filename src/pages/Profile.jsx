import { getAuth, updateProfile } from 'firebase/auth';
import { collection, doc, getDoc, orderBy,where, query, updateDoc,getDocs, deleteDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { db } from '../firebase';
import { FcHome } from "react-icons/fc";
import ListingItems from '../components/ListingItems';

export default function Profile() {
  const auth=getAuth();
  const navigate= useNavigate();
  const [changeDetail,setChangeDetail]=useState(false);
  const [listings,setListings]=useState(null);
  const [loading,setLoading]=useState(true);
  // error is occuring because we are rendering data before the page is reloaded
  const [formData,setFormData]=useState(
    {
     name :auth.currentUser.displayName,
     email:auth.currentUser.email,
    }
   );
   // destructring 
   const {name,email}=formData;
   function onLogout(){
    auth.signOut();
    navigate("/");

   }
   function onChange(e){
    setFormData((prevState)=>({
      ...prevState,
      [e.target.id]: e.target.value,

    }));

   }
   async function onSubmit() {
    try {
      if (auth.currentUser.displayName !== name) {
        //update display name in firebase auth
        await updateProfile(auth.currentUser, {
          displayName: name,
        });

        // update name in the firestore

        const docRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(docRef, {
          name,
        });
      }
      toast.success("Profile details updated");
    } catch (error) {
      toast.error("Could not update the profile details");
    }
  }
     // fetching the data from firebase to show listing of the person signed in
     useEffect(() => {
      async function fetchUserListings() {
        const listingRef = collection(db, "listings");
        const q = query(
          listingRef,
          where("userRef", "==", auth.currentUser.uid),
          orderBy("timestamp", "desc")
        );
        const querySnap = await getDocs(q);
        let listings = [];
        querySnap.forEach((doc) => {
          return listings.push({
            id: doc.id,
            data: doc.data(),
          });
        });
        setListings(listings);
        setLoading(false);
      }
      fetchUserListings();
    }, [auth.currentUser.uid]);

  async function onDelete(listingID){
    if(window.confirm("Are you sure you want to delete ?")){
          // if yes we will add this functionality
          await deleteDoc(doc(db,"listings",listingID)) // after deleting we have to update the listing
          const updatedListings=listings.filter(
            (listing)=> listing.id!==listingID // filter all the id except we want to delete
          );
          setListings(updatedListings)
          toast.success("Successfully deleted the listing")
    }


  }
  function onEdit(listingID){
    navigate(`/edit-listing/${listingID}`)

  }
  



  return (
    <>
        <section className='max-w-6xl mx-auto flex justify-center 
        items-center flex-col'>
          <h1 className='text-3xl text-center
          mt-6 font-bold'>My Profile</h1>
          <div className='w-full md:w-[50%] mt-6
          px-3'>
            <form action="">
              {/* Name Input */}
              <input type="text" id='name' value={name} 
              disabled={!changeDetail} onChange={onChange} className={`w-full px-4 py-2 text-xl
              text-gray-700 bg-white border border-gray-300
              rounded transition ease-in-out mb-6 ${changeDetail &&
              "bg-red-200 focus:bg-red-200"}`}/>

               {/* email input */}
               <input type="email" id='email' value={email} 
              disabled={!changeDetail} onChange={onChange}
               className={`w-full px-4 py-2 text-xl
              text-gray-700 bg-white border border-gray-300
              rounded transition ease-in-out mb-6 ${changeDetail &&
                "bg-red-200 focus:bg-red-200"}`}/>

              <div className='flex justify-between whitespace-nowrap
              text-sm sm:text-lg'>
                <p className='flex items-center mb-6'>Do you want to change your name?
                  <span className='text-red-600 hover:text-red-700
                  transition ease-in-out duration-200 ml-2
                  cursor-pointer' onClick={()=>{
                    changeDetail && onSubmit();
                    setChangeDetail((prevState)=>!prevState)
                  }}>
                    {changeDetail ? "Apply Change" : "Edit" }</span>
                </p>
                <p onClick={onLogout} className='text-blue-600 hover:text-blue-800
                transition ease-in-out duration-200 ml-1
                cursor-pointer'>Sign out</p>
              </div>

            </form>
            <button  className='w-full bg-blue-600 text-white flex
            uppercase px-7 py-3 text-sm font-medium rounded shadow-md hover:bg-blue-700
            transition duration-150 ease-in-out hover:shadow-lg active:bg-blue-800'
             type='submit'>
              <Link  to="/create-listing" className='flex  items-center justify-center'>
                 <FcHome className='mr-2 text-3xl bg-red-200 rounded-full p-1 border-2' />
                 Sell or rent your home</Link>
            </button>
          </div>
        </section>
        <div className='max-w-6xl px-3 mt-6 mx-auto'>
          {!loading && listings.length>0 && (
            <>
             <h2 className='text-2xl text-center font-semibold mb-6 mt-6
             '>My Listings</h2>
             <ul className='sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5
             mt-6 mb-6'>
              {listings.map((listing)=>(
                <ListingItems
                 key={listing.id} 
                 id={listing.id}
                listing={listing.data}
                onDelete={()=>onDelete(listing.id)}
                onEdit={()=>onEdit(listing.id)}
                />
              ))}
             </ul>
            </>
          )}
        </div>
      
    </>
  )
}
