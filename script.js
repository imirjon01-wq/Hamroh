import { auth, db, storage } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  setDoc,
  getDoc,
  deleteDoc,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

// Pastki menyu
function showPage(page) {
  alert(page + " sahifasi tez orada qo'shiladi!");
}

const buttons = document.querySelectorAll(".bottom-nav button");

if (buttons.length >= 5) {
  buttons[0].onclick = () => showPage("Bosh sahifa");
  buttons[1].onclick = () => showPage("Chat");
  buttons[2].onclick = () => showPage("Post qo'shish");
  buttons[3].onclick = () => showPage("Bildirishnomalar");
  buttons[4].onclick = () => showPage("Profil");
}

// Post qo'shish
window.addPost = async function () {

  const postText = document.getElementById("postText").value.trim();
  const imageFile = document.getElementById("postImage").files[0];

  if (!postText && !imageFile) {
    alert("Post yoki rasm tanlang!");
    return;
  }

  try {

    let imageUrl = "";

    if (imageFile) {

      const imageRef = ref(
        storage,
        "posts/" + Date.now() + "_" + imageFile.name
      );

      await uploadBytes(imageRef, imageFile);

      imageUrl = await getDownloadURL(imageRef);
    }

    await addDoc(collection(db, "posts"), {
      uid: auth.currentUser?.uid || "",
      username: auth.currentUser?.displayName || "Foydalanuvchi",
      text: postText,
      image: imageUrl,
      createdAt: serverTimestamp(),
      likes: 0
    });

    document.getElementById("postText").value = "";
    document.getElementById("postImage").value = "";

    alert("Post muvaffaqiyatli joylandi!");

  } catch (e) {
    alert(e.message);
  }

};
// Postlarni ko'rsatish
const postsDiv = document.getElementById("posts");

if (postsDiv) {

  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (snapshot) => {

    postsDiv.innerHTML = "";

    snapshot.forEach((item) => {

      const post = item.data();
      const postId = item.id;

      postsDiv.innerHTML += `
      <div class="post">

        <h3>${post.username}</h3>

        <p>${post.text}</p>

        ${post.image ? `<img src="${post.image}" class="post-img">` : ""}

        <small>${post.createdAt?.toDate().toLocaleString() || "Hozirgina"}</small>

        <br><br>

        <button onclick="likePost('${postId}')">
          ❤️ ${post.likes || 0}
        </button>
${auth.currentUser && auth.currentUser.uid === post.uid ? `
<br><br>
<button onclick="deletePost('${postId}')">
🗑️ O'chirish
</button>
` : ""}        <hr>

        <div id="comments-${postId}"></div>

        <input
          type="text"
          id="commentInput-${postId}"
          placeholder="Izoh yozing..."
        >

        <button onclick="addComment('${postId}')">
          Yuborish
        </button>

      </div>
      `;

      loadComments(postId);

    });

  });

}
 //Like
window.likePost = async function(postId){

  if (!auth.currentUser){
    alert("Avval tizimga kiring!");
    return;
  }

  const uid = auth.currentUser.uid;

  try{

    const postRef = doc(db, "posts", postId);
    const likeRef = doc(db, "posts", postId, "likes", uid);

    const likeSnap = await getDoc(likeRef);

    if(likeSnap.exists()){

      await deleteDoc(likeRef);

      await updateDoc(postRef,{
        likes: increment(-1)
      });

    }else{

      await setDoc(likeRef,{
        uid: uid,
        createdAt: serverTimestamp()
      });

      await updateDoc(postRef,{
        likes: increment(1)
      });

    }

  }catch(error){
    alert(error.message);
  }

};

 //Komment qo'shish
window.addComment = async function(postId){

  try{

    const input = document.getElementById("commentInput-" + postId);
    const text = input.value.trim();

    if(!text) return;

    await addDoc(collection(db,"posts",postId,"comments"),{
      username: auth.currentUser?.displayName || "Foydalanuvchi",
      text: text,
      likes: 0,
      createdAt: serverTimestamp()
    });

    input.value = "";

  }catch(error){
    alert(error.message);
  }

};

//Kommentlarni yuklash
function loadComments(postId){

  const div = document.getElementById("comments-" + postId);

  onSnapshot(
    query(
      collection(db,"posts",postId,"comments"),
      orderBy("createdAt","asc")
    ),
    (snapshot)=>{

      div.innerHTML = "";

      snapshot.forEach((item)=>{

        const c = item.data();

        div.innerHTML += `
<div class="comment">

<b>${c.username}</b><br>

${c.text}

<br>

<button onclick="likeComment('${postId}','${item.id}')">
❤️ ${c.likes || 0}
</button>

</div>
        `;

      });

    },
    (error)=>{
      console.error(error);
    }
  );

}

// Avatar
window.uploadAvatar = async function () {

  if (!auth.currentUser) {
    alert("Avval tizimga kiring!");
    return;
  }

  const file = document.getElementById("avatarInput").files[0];

  if (!file) {
    alert("Rasm tanlang!");
    return;
  }

  try {

    const avatarRef = ref(storage, "avatars/" + auth.currentUser.uid);

    await uploadBytes(avatarRef, file);

    const url = await getDownloadURL(avatarRef);

    await setDoc(doc(db, "users", auth.currentUser.uid), {
      uid: auth.currentUser.uid,
      username: auth.currentUser.displayName || "Foydalanuvchi",
      avatar: url
    }, { merge: true });

    document.getElementById("avatar").src = url;

    alert("Avatar muvaffaqiyatli saqlandi!");

  } catch (error) {
    alert(error.message);
  }

};
auth.onAuthStateChanged(async (user) => {

  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));

  if (snap.exists()) {

    const data = snap.data();

    if (data.avatar) {
      document.getElementById("avatar").src = data.avatar;
    }

  }

});
window.likeComment = async function(postId, commentId){

  try{

    await updateDoc(
      doc(db,"posts",postId,"comments",commentId),
      {
        likes: increment(1)
      }
    );

  }catch(error){

    alert(error.message);

  }

};
window.deletePost = async function(postId){

  if(!confirm("Postni o'chirmoqchimisiz?")) return;

  try{

    await deleteDoc(doc(db, "posts", postId));

    alert("Post o'chirildi!");

  }catch(error){

    alert(error.message);

  }

};