/* ============================================
   SYSTEMS UNDER SIEGE - Blog JavaScript
   "One Woman's Battle for a Clean House"
   ============================================ */

const CONFIG = {
  blogId: 'systems-under-siege',
  workerUrl: 'https://up-blogs-1.micaiah-tasks.workers.dev',
  ga4MeasurementId: 'G-M1ZBLY61CF',
  facebookPixelId: '1545863786644043'
};

/* ============================================
   SUBSCRIBE FUNCTIONALITY
   ============================================ */

async function handleSubscribe(event) {
  event.preventDefault();
  
  const form = event.target;
  const emailInput = form.querySelector('input[type="email"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const email = emailInput.value.trim();
  
  if (!email) {
    showToast('Please enter your email address', 'error');
    return;
  }
  
  emailInput.disabled = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Subscribing...';
  
  try {
    const response = await fetch(`${CONFIG.workerUrl}/${CONFIG.blogId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Welcome! Check your inbox for confirmation.', 'success');
      emailInput.value = '';
      if (typeof gtag !== 'undefined') {
        gtag('event', 'subscribe', { event_category: 'engagement', event_label: 'newsletter' });
      }
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Subscribe');
      }
    } else {
      showToast(data.error || 'Something went wrong. Try again?', 'error');
    }
  } catch (error) {
    console.error('Subscribe error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    emailInput.disabled = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Subscribe';
  }
}

/* ============================================
   LIKE FUNCTIONALITY
   ============================================ */

async function handleLike(postSlug, button) {
  const countSpan = button.querySelector('.like-count');
  const currentCount = parseInt(countSpan.textContent) || 0;
  const isLiked = button.classList.contains('liked');
  
  button.classList.toggle('liked');
  countSpan.textContent = isLiked ? currentCount - 1 : currentCount + 1;
  
  try {
    const response = await fetch(`${CONFIG.workerUrl}/${CONFIG.blogId}/posts/${postSlug}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      countSpan.textContent = data.likes;
      const likedPosts = JSON.parse(localStorage.getItem('siege_liked') || '[]');
      if (!isLiked) {
        if (!likedPosts.includes(postSlug)) likedPosts.push(postSlug);
      } else {
        const index = likedPosts.indexOf(postSlug);
        if (index > -1) likedPosts.splice(index, 1);
      }
      localStorage.setItem('siege_liked', JSON.stringify(likedPosts));
      if (typeof gtag !== 'undefined') {
        gtag('event', 'like', { event_category: 'engagement', event_label: postSlug });
      }
    } else {
      button.classList.toggle('liked');
      countSpan.textContent = currentCount;
    }
  } catch (error) {
    console.error('Like error:', error);
    button.classList.toggle('liked');
    countSpan.textContent = currentCount;
  }
}

function initLikeStates() {
  const likedPosts = JSON.parse(localStorage.getItem('siege_liked') || '[]');
  document.querySelectorAll('.like-btn').forEach(btn => {
    const postSlug = btn.dataset.postSlug;
    if (likedPosts.includes(postSlug)) btn.classList.add('liked');
  });
}

/* ============================================
   SHARE FUNCTIONALITY
   ============================================ */

function openShareModal(postTitle, postUrl) {
  const modal = document.getElementById('share-modal');
  if (!modal) return;
  modal.dataset.title = postTitle;
  modal.dataset.url = postUrl;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeShareModal() {
  const modal = document.getElementById('share-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function shareToTwitter() {
  const modal = document.getElementById('share-modal');
  const title = modal.dataset.title;
  const url = modal.dataset.url;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank', 'width=550,height=420');
  closeShareModal();
  trackShare('twitter');
}

function shareToFacebook() {
  const modal = document.getElementById('share-modal');
  const url = modal.dataset.url;
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=550,height=420');
  closeShareModal();
  trackShare('facebook');
}

function shareToLinkedIn() {
  const modal = document.getElementById('share-modal');
  const title = modal.dataset.title;
  const url = modal.dataset.url;
  window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank', 'width=550,height=420');
  closeShareModal();
  trackShare('linkedin');
}

async function copyLink() {
  const modal = document.getElementById('share-modal');
  const url = modal.dataset.url;
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard!', 'success');
  } catch (error) {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('Link copied to clipboard!', 'success');
  }
  closeShareModal();
  trackShare('copy');
}

function trackShare(platform) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'share', { event_category: 'engagement', event_label: platform });
  }
  if (typeof fbq !== 'undefined') {
    fbq('track', 'Share', { platform });
  }
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ============================================
   INITIALIZATION
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  initLikeStates();
  
  document.querySelectorAll('.subscribe-form').forEach(form => {
    form.addEventListener('submit', handleSubscribe);
  });
  
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      handleLike(this.dataset.postSlug, this);
    });
  });
  
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      openShareModal(this.dataset.postTitle, this.dataset.postUrl || window.location.href);
    });
  });
  
  const shareModal = document.getElementById('share-modal');
  if (shareModal) {
    shareModal.addEventListener('click', function(e) {
      if (e.target === shareModal) closeShareModal();
    });
  }
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeShareModal();
  });
});