const ORE_PER_GEM = 6;
const MAX_ORE_PER_MATERIAL = 75000;
const MAX_GEMS_PER_MATERIAL =
  Math.floor(MAX_ORE_PER_MATERIAL / ORE_PER_GEM);

// Paste your Cloudflare Worker URL here
const ORDER_ENDPOINT = "";

const MATERIALS = [
  {
    name: "Dustite",
    orePrice: 1000,
    gemName: "Opal",
    gemPrice: 25000,
    oreImage: "dustite.png",
    gemImage: "opal.png"
  },
  {
    name: "Void Rift",
    orePrice: 350,
    gemName: null,
    gemPrice: null,
    oreImage: "void-rift.png",
    gemImage: null
  },
  {
    name: "Gold",
    orePrice: 1500,
    gemName: null,
    gemPrice: null,
    oreImage: "gold.png",
    gemImage: null
  },
  {
    name: "Copite",
    orePrice: 550,
    gemName: "Amber",
    gemPrice: 27000,
    oreImage: "copite.png",
    gemImage: "amber.png"
  },
  {
    name: "Velorite",
    orePrice: 650,
    gemName: "Aquastone",
    gemPrice: 29000,
    oreImage: "velorite.png",
    gemImage: "aquastone.png"
  },
  {
    name: "Crimsite",
    orePrice: 750,
    gemName: "Garnet",
    gemPrice: 31500,
    oreImage: "crimsite.png",
    gemImage: "garnet.png"
  },
  {
    name: "Shalore",
    orePrice: 850,
    gemName: "Frostgem",
    gemPrice: 33500,
    oreImage: "shalore.png",
    gemImage: "frostgem.png"
  },
  {
    name: "Noctite",
    orePrice: 950,
    gemName: "Voidopal",
    gemPrice: 35500,
    oreImage: "noctite.png",
    gemImage: "voidopal.png"
  },
  {
    name: "Auorite",
    orePrice: 1050,
    gemName: "Sunstone",
    gemPrice: 37500,
    oreImage: "auorite.png",
    gemImage: "sunstone.png"
  },
  {
    name: "Vexite",
    orePrice: 1150,
    gemName: "Duskgem",
    gemPrice: 39500,
    oreImage: "vexite.png",
    gemImage: "duskgem.png"
  },
  {
    name: "Zephyne",
    orePrice: 1250,
    gemName: "Stormheart",
    gemPrice: 41500,
    oreImage: "zephyne.png",
    gemImage: "stormheart.png"
  },
  {
    name: "Korunite",
    orePrice: 1350,
    gemName: "Astralite",
    gemPrice: 44000,
    oreImage: "korunite.png",
    gemImage: "astralite.png"
  },
  {
    name: "Drakonite",
    orePrice: 1450,
    gemName: "Emberstone",
    gemPrice: 46000,
    oreImage: "drakonite.png",
    gemImage: "emberstone.png"
  },
  {
    name: "Potent Void Rift",
    orePrice: 350,
    gemName: null,
    gemPrice: null,
    oreImage: "potent-void-rift.png",
    gemImage: null
  },
  {
    name: "Pyrethium",
    orePrice: 1550,
    gemName: "Magmaheart",
    gemPrice: 48000,
    oreImage: "pyrethium.png",
    gemImage: "magmaheart.png"
  },
  {
    name: "Infernite",
    orePrice: 1650,
    gemName: "Pyreshard",
    gemPrice: 50000,
    oreImage: "infernite.png",
    gemImage: "pyreshard.png"
  }
];

const state = {
  cart: {},
  search: ""
};

const materialList = document.querySelector("#materialList");
const materialTemplate = document.querySelector("#materialTemplate");
const searchInput = document.querySelector("#search");
const cartItems = document.querySelector("#cartItems");
const grandTotal = document.querySelector("#grandTotal");
const cartCount = document.querySelector("#cartCount");
const topBasketCount = document.querySelector("#topBasketCount");
const validationMessage = document.querySelector("#validationMessage");
const customerName = document.querySelector("#customerName");
const orderNotes = document.querySelector("#orderNotes");
const submitOrderButton = document.querySelector("#submitOrder");
const submitStatus = document.querySelector("#submitStatus");
const clearOrderButton = document.querySelector("#clearOrder");

function gp(value) {
  return `${Number(value).toLocaleString()} GP`;
}

function getMaterial(name) {
  return MATERIALS.find(material => material.name === name);
}

function getEntry(materialName) {
  if (!state.cart[materialName]) {
    state.cart[materialName] = {
      manualOre: 0,
      gems: 0
    };
  }

  return state.cart[materialName];
}

function getRequiredOre(materialName) {
  const entry = getEntry(materialName);

  return Math.min(
    entry.gems * ORE_PER_GEM,
    MAX_ORE_PER_MATERIAL
  );
}

function getEffectiveOre(materialName) {
  const entry = getEntry(materialName);

  return Math.min(
    MAX_ORE_PER_MATERIAL,
    Math.max(
      entry.manualOre,
      getRequiredOre(materialName)
    )
  );
}

function getAutomaticOre(materialName) {
  const entry = getEntry(materialName);

  return Math.max(
    0,
    getEffectiveOre(materialName) - entry.manualOre
  );
}

function normalizeCart() {
  Object.keys(state.cart).forEach(materialName => {
    const material = getMaterial(materialName);
    const entry = state.cart[materialName];

    if (!material || !entry || typeof entry !== "object") {
      delete state.cart[materialName];
      return;
    }

    entry.manualOre = Math.floor(
      Math.max(
        0,
        Math.min(
          Number(entry.manualOre) || 0,
          MAX_ORE_PER_MATERIAL
        )
      )
    );

    entry.gems = Math.floor(
      Math.max(
        0,
        Math.min(
          Number(entry.gems) || 0,
          MAX_GEMS_PER_MATERIAL
        )
      )
    );

    if (entry.manualOre === 0 && entry.gems === 0) {
      delete state.cart[materialName];
    }
  });
}

function saveCart() {
  normalizeCart();

  localStorage.setItem(
    "koruxaMarketCart",
    JSON.stringify(state.cart)
  );
}

function getTotalItemCount() {
  let total = 0;

  Object.keys(state.cart).forEach(materialName => {
    const entry = state.cart[materialName];

    total += getEffectiveOre(materialName);
    total += entry.gems;
  });

  return total;
}

function calculateGrandTotal() {
  let total = 0;

  Object.keys(state.cart).forEach(materialName => {
    const material = getMaterial(materialName);
    const entry = state.cart[materialName];

    if (!material) return;

    const oreQty = getEffectiveOre(materialName);

    total += oreQty * material.orePrice;

    if (entry.gems > 0 && material.gemPrice != null) {
      total += entry.gems * material.gemPrice;
    }
  });

  return total;
}

function showOreLimit(materialName) {
  alert(
    `You can only order a maximum of ${MAX_ORE_PER_MATERIAL.toLocaleString()} ${materialName} Ore.`
  );
}

function setVisualImage(container, src, alt) {
  container.innerHTML = "";

  const img = document.createElement("img");

  img.src = src;
  img.alt = alt;
  img.className = "market-item-image";

  img.onerror = () => {
    container.innerHTML =
      alt.includes("Ore") ? "⛏️" : "💎";
  };

  container.appendChild(img);
}

function renderMaterials() {
  materialList.innerHTML = "";

  const query = state.search.trim().toLowerCase();

  const filtered = MATERIALS.filter(material => {
    const text =
      `${material.name} ${material.gemName || ""}`.toLowerCase();

    return text.includes(query);
  });

  if (!filtered.length) {
    materialList.innerHTML = `
      <div class="no-results">
        No matching materials found.
      </div>
    `;
    return;
  }

  filtered.forEach(material => {
    const fragment =
      materialTemplate.content.cloneNode(true);

    const card =
      fragment.querySelector(".material-card");

    const visualContainer =
      fragment.querySelector(".visual-icon");

    const category =
      fragment.querySelector(".material-category");

    const title =
      fragment.querySelector("h3");

    const secondary =
      fragment.querySelector(".material-secondary");

    const oreButton =
      fragment.querySelector(".ore-button");

    const gemButton =
      fragment.querySelector(".gem-button");

    const gemButtonName =
      fragment.querySelector(".gem-button-name");

    const unitPriceElement =
      fragment.querySelector(".unit-price");

    const requirementInfo =
      fragment.querySelector(".requirement-info");

    const qtyInput =
      fragment.querySelector(".qty-input");

    const lineTotal =
      fragment.querySelector(".line-total");

    const addButton =
      fragment.querySelector(".add-button");

    let selectedType = "ore";

    if (material.gemName) {
      gemButtonName.textContent = material.gemName;
    } else {
      gemButtonName.textContent = "No Gem";
      gemButton.disabled = true;
    }

    function getRemainingAvailable() {
      const entry = getEntry(material.name);

      if (selectedType === "ore") {
        return Math.max(
          0,
          MAX_ORE_PER_MATERIAL -
          getEffectiveOre(material.name)
        );
      }

      return Math.max(
        0,
        MAX_GEMS_PER_MATERIAL - entry.gems
      );
    }

    function updateQuantityLimit() {
      const remaining =
        getRemainingAvailable();

      qtyInput.max =
        String(Math.max(1, remaining));

      if (remaining <= 0) {
        qtyInput.disabled = true;
        addButton.disabled = true;
        addButton.innerHTML =
          `<span>Max Reached</span>`;
      } else {
        qtyInput.disabled = false;
        addButton.disabled = false;

        addButton.innerHTML = `
          <span>Add</span>
          <span>+</span>
        `;

        let quantity =
          parseInt(qtyInput.value, 10);

        if (
          !Number.isFinite(quantity) ||
          quantity < 1
        ) {
          quantity = 1;
        }

        if (quantity > remaining) {
          quantity = remaining;
        }

        qtyInput.value =
          String(quantity);
      }
    }

    function updateTypeDisplay() {
      const entry =
        getEntry(material.name);

      const currentOre =
        getEffectiveOre(material.name);

      card.classList.toggle(
        "gem-selected",
        selectedType === "gem"
      );

      if (selectedType === "ore") {
        setVisualImage(
          visualContainer,
          material.oreImage,
          `${material.name} Ore`
        );

        category.textContent =
          "ORE";

        title.textContent =
          material.name;

        secondary.textContent =
          material.gemName
            ? `Matching gem: ${material.gemName}`
            : "Ore only";

        unitPriceElement.textContent =
          gp(material.orePrice);

        requirementInfo.innerHTML = `
          <strong>
            ${currentOre.toLocaleString()}
            /
            ${MAX_ORE_PER_MATERIAL.toLocaleString()}
          </strong>
          <br>
          Ore limit
        `;
      } else {
        setVisualImage(
          visualContainer,
          material.gemImage,
          material.gemName
        );

        category.textContent =
          "UNCUT GEM";

        title.textContent =
          material.gemName;

        secondary.textContent =
          `Matched with ${material.name} Ore`;

        unitPriceElement.textContent =
          gp(material.gemPrice);

        requirementInfo.innerHTML = `
          <strong>
            ${ORE_PER_GEM} Ore / Gem
          </strong>
          <br>
          ${entry.gems.toLocaleString()}
          /
          ${MAX_GEMS_PER_MATERIAL.toLocaleString()}
          Gems
        `;
      }

      oreButton.classList.toggle(
        "active",
        selectedType === "ore"
      );

      gemButton.classList.toggle(
        "active",
        selectedType === "gem"
      );

      updateQuantityLimit();
      updateLineTotal();
    }

    function updateLineTotal() {
      let quantity =
        Number(qtyInput.value);

      if (
        !Number.isFinite(quantity) ||
        quantity < 1
      ) {
        quantity = 1;
      }

      const remaining =
        getRemainingAvailable();

      if (
        remaining > 0 &&
        quantity > remaining
      ) {
        quantity = remaining;
      }

      quantity =
        Math.floor(quantity);

      qtyInput.value =
        String(quantity);

      const price =
        selectedType === "ore"
          ? material.orePrice
          : material.gemPrice;

      lineTotal.textContent =
        gp(price * quantity);
    }

    oreButton.addEventListener(
      "click",
      () => {
        selectedType = "ore";
        qtyInput.value = "1";
        updateTypeDisplay();
      }
    );

    gemButton.addEventListener(
      "click",
      () => {
        if (
          !material.gemName ||
          material.gemPrice == null
        ) {
          return;
        }

        selectedType = "gem";
        qtyInput.value = "1";

        updateTypeDisplay();
      }
    );

    qtyInput.addEventListener(
      "input",
      () => {
        let quantity =
          Number(qtyInput.value);

        if (!Number.isFinite(quantity)) {
          return;
        }

        quantity =
          Math.floor(quantity);

        const remaining =
          getRemainingAvailable();

        if (quantity > remaining) {
          quantity = remaining;
        }

        if (
          quantity < 1 &&
          remaining > 0
        ) {
          quantity = 1;
        }

        qtyInput.value =
          String(quantity);

        updateLineTotal();
      }
    );

    addButton.addEventListener(
      "click",
      () => {
        const entry =
          getEntry(material.name);

        let quantity =
          Number(qtyInput.value);

        if (
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          quantity = 1;
        }

        if (selectedType === "ore") {
          const currentOre =
            getEffectiveOre(material.name);

          const remaining =
            MAX_ORE_PER_MATERIAL -
            currentOre;

          if (remaining <= 0) {
            showOreLimit(material.name);
            return;
          }

          quantity =
            Math.min(
              quantity,
              remaining
            );

          entry.manualOre =
            Math.min(
              MAX_ORE_PER_MATERIAL,
              currentOre + quantity
            );
        } else {
          const remainingGems =
            MAX_GEMS_PER_MATERIAL -
            entry.gems;

          if (remainingGems <= 0) {
            alert(
              `Maximum ${MAX_GEMS_PER_MATERIAL.toLocaleString()} ${material.gemName} per order.`
            );

            return;
          }

          quantity =
            Math.min(
              quantity,
              remainingGems
            );

          const proposedGems =
            entry.gems + quantity;

          const requiredOre =
            proposedGems *
            ORE_PER_GEM;

          if (
            requiredOre >
            MAX_ORE_PER_MATERIAL
          ) {
            showOreLimit(material.name);
            return;
          }

          entry.gems =
            proposedGems;
        }

        saveCart();
        renderCart();
        renderMaterials();
      }
    );

    updateTypeDisplay();

    materialList.appendChild(
      fragment
    );
  });
}

function createCartRow({
  image,
  name,
  metadata,
  note,
  quantity,
  price,
  onMinus,
  onPlus,
  onRemove
}) {
  const row =
    document.createElement("div");

  row.className =
    "cart-row";

  row.innerHTML = `
    <div class="cart-icon">
      <img
        src="${image}"
        alt="${name}"
        class="cart-item-image"
        onerror="this.style.display='none'"
      >
    </div>

    <div>
      <div class="cart-name">
        ${name}
      </div>

      <div class="cart-meta">
        ${metadata}
      </div>

      ${
        note
          ? `
            <div class="auto-ore-note">
              ${note}
            </div>
          `
          : ""
      }
    </div>

    <div class="cart-right">
      <div class="cart-price">
        ${price}
      </div>

      <div class="cart-controls">
        <button
          class="cart-control-button minus"
          type="button"
        >
          −
        </button>

        <span class="cart-qty">
          ${quantity}
        </span>

        <button
          class="cart-control-button plus"
          type="button"
        >
          +
        </button>

        <button
          class="cart-control-button remove-cart-button remove"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  `;

  row
    .querySelector(".minus")
    .addEventListener(
      "click",
      onMinus
    );

  row
    .querySelector(".plus")
    .addEventListener(
      "click",
      onPlus
    );

  row
    .querySelector(".remove")
    .addEventListener(
      "click",
      onRemove
    );

  return row;
}

function renderCart() {
  normalizeCart();

  cartItems.innerHTML = "";

  const materialNames =
    Object.keys(state.cart);

  if (!materialNames.length) {
    cartItems.innerHTML = `
      <div class="empty-basket">
        <div class="empty-icon">
          🛒
        </div>

        <strong>
          Your basket is empty
        </strong>

        <span>
          Add some Ore or Gems above.
        </span>
      </div>
    `;
  }

  materialNames.forEach(
    materialName => {
      const material =
        getMaterial(materialName);

      if (!material) return;

      const entry =
        getEntry(materialName);

      const oreQty =
        getEffectiveOre(materialName);

      const autoOre =
        getAutomaticOre(materialName);

      if (oreQty > 0) {
        let note = "";

        if (autoOre > 0) {
          note =
            `${autoOre.toLocaleString()} Ore automatically added for Gem requirements`;
        }

        if (
          oreQty ===
          MAX_ORE_PER_MATERIAL
        ) {
          if (note) {
            note += " • ";
          }

          note +=
            "75,000 Ore maximum reached";
        }

        const oreRow =
          createCartRow({
            image:
              material.oreImage,

            name:
              `${material.name} Ore`,

            metadata:
              `${oreQty.toLocaleString()} × ${gp(material.orePrice)}`,

            note,

            quantity:
              oreQty.toLocaleString(),

            price:
              gp(
                oreQty *
                material.orePrice
              ),

            onMinus() {
              if (
                entry.manualOre > 0
              ) {
                entry.manualOre--;
              }

              saveCart();
              renderCart();
              renderMaterials();
            },

            onPlus() {
              const currentOre =
                getEffectiveOre(
                  materialName
                );

              if (
                currentOre >=
                MAX_ORE_PER_MATERIAL
              ) {
                showOreLimit(
                  materialName
                );

                return;
              }

              entry.manualOre =
                Math.min(
                  MAX_ORE_PER_MATERIAL,
                  currentOre + 1
                );

              saveCart();
              renderCart();
              renderMaterials();
            },

            onRemove() {
              entry.manualOre = 0;

              saveCart();
              renderCart();
              renderMaterials();
            }
          });

        cartItems.appendChild(
          oreRow
        );
      }

      if (
        entry.gems > 0 &&
        material.gemName
      ) {
        const gemRow =
          createCartRow({
            image:
              material.gemImage,

            name:
              `${material.gemName} (Uncut Gem)`,

            metadata:
              `${entry.gems.toLocaleString()} × ${gp(material.gemPrice)}`,

            note:
              `Requires ${(entry.gems * ORE_PER_GEM).toLocaleString()} ${material.name} Ore`,

            quantity:
              entry.gems.toLocaleString(),

            price:
              gp(
                entry.gems *
                material.gemPrice
              ),

            onMinus() {
              entry.gems =
                Math.max(
                  0,
                  entry.gems - 1
                );

              saveCart();
              renderCart();
              renderMaterials();
            },

            onPlus() {
              if (
                entry.gems >=
                MAX_GEMS_PER_MATERIAL
              ) {
                alert(
                  `Maximum ${MAX_GEMS_PER_MATERIAL.toLocaleString()} ${material.gemName} per order.`
                );

                return;
              }

              const proposed =
                entry.gems + 1;

              const requiredOre =
                proposed *
                ORE_PER_GEM;

              if (
                requiredOre >
                MAX_ORE_PER_MATERIAL
              ) {
                showOreLimit(
                  materialName
                );

                return;
              }

              entry.gems =
                proposed;

              saveCart();
              renderCart();
              renderMaterials();
            },

            onRemove() {
              entry.gems = 0;

              saveCart();
              renderCart();
              renderMaterials();
            }
          });

        cartItems.appendChild(
          gemRow
        );
      }
    }
  );

  const totalItems =
    getTotalItemCount();

  cartCount.textContent =
    totalItems.toLocaleString();

  topBasketCount.textContent =
    totalItems.toLocaleString();

  grandTotal.textContent =
    gp(
      calculateGrandTotal()
    );

  const automaticOre =
    Object.keys(state.cart)
      .reduce(
        (total, name) =>
          total +
          getAutomaticOre(name),
        0
      );

  if (automaticOre > 0) {
    validationMessage.textContent =
      `✓ ${automaticOre.toLocaleString()} Ore automatically added for Gem requirements. Maximum 75,000 of each Ore.`;
  } else {
    validationMessage.textContent =
      `Maximum order: ${MAX_ORE_PER_MATERIAL.toLocaleString()} of each Ore type.`;
  }
}

function buildOrder() {
  const items = [];

  Object.keys(state.cart)
    .forEach(
      materialName => {
        const material =
          getMaterial(materialName);

        if (!material) return;

        const entry =
          getEntry(materialName);

        const oreQty =
          getEffectiveOre(
            materialName
          );

        if (oreQty > 0) {
          items.push({
            material:
              materialName,

            itemName:
              `${materialName} Ore`,

            type:
              "ore",

            quantity:
              oreQty,

            unitPrice:
              material.orePrice,

            total:
              oreQty *
              material.orePrice,

            automaticOre:
              getAutomaticOre(
                materialName
              )
          });
        }

        if (
          entry.gems > 0 &&
          material.gemName
        ) {
          items.push({
            material:
              materialName,

            itemName:
              material.gemName,

            type:
              "gem",

            quantity:
              entry.gems,

            unitPrice:
              material.gemPrice,

            total:
              entry.gems *
              material.gemPrice
          });
        }
      }
    );

  return {
    customerName:
      customerName
        .value
        .trim(),

    notes:
      orderNotes
        .value
        .trim(),

    items,

    total:
      calculateGrandTotal(),

    submittedAt:
      new Date()
        .toISOString()
  };
}

searchInput.addEventListener(
  "input",
  event => {
    state.search =
      event.target.value;

    renderMaterials();
  }
);

customerName.addEventListener(
  "input",
  () => {
    localStorage.setItem(
      "koruxaCustomerName",
      customerName.value
    );
  }
);

orderNotes.addEventListener(
  "input",
  () => {
    localStorage.setItem(
      "koruxaOrderNotes",
      orderNotes.value
    );
  }
);

clearOrderButton.addEventListener(
  "click",
  () => {
    if (
      !Object.keys(
        state.cart
      ).length
    ) {
      return;
    }

    if (
      !confirm(
        "Clear your entire basket?"
      )
    ) {
      return;
    }

    state.cart = {};

    saveCart();
    renderCart();
    renderMaterials();

    submitStatus.textContent =
      "";
  }
);

submitOrderButton.addEventListener(
  "click",
  async () => {
    normalizeCart();

    submitStatus.className =
      "submit-status";

    submitStatus.textContent =
      "";

    if (
      !Object.keys(
        state.cart
      ).length
    ) {
      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        "Your basket is empty.";

      return;
    }

    if (
      !customerName
        .value
        .trim()
    ) {
      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        "Please enter your Discord or game name.";

      customerName.focus();

      return;
    }

    for (
      const materialName
      of Object.keys(state.cart)
    ) {
      const oreQty =
        getEffectiveOre(
          materialName
        );

      if (
        oreQty >
        MAX_ORE_PER_MATERIAL
      ) {
        submitStatus.className =
          "submit-status error";

        submitStatus.textContent =
          `${materialName} Ore cannot exceed ${MAX_ORE_PER_MATERIAL.toLocaleString()}.`;

        return;
      }
    }

    if (!ORDER_ENDPOINT) {
      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        "Cloudflare Worker URL still needs to be added.";

      return;
    }

    const order =
      buildOrder();

    submitOrderButton.disabled =
      true;

    const buttonText =
      submitOrderButton
        .querySelector(
          "span:first-child"
        );

    if (buttonText) {
      buttonText.textContent =
        "Submitting...";
    }

    try {
      const response =
        await fetch(
          ORDER_ENDPOINT,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(order)
          }
        );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ||
          "Order submission failed."
        );
      }

      submitStatus.className =
        "submit-status success";

      submitStatus.textContent =
        "✓ Your order was submitted successfully!";

      state.cart = {};

      orderNotes.value = "";

      localStorage.removeItem(
        "koruxaOrderNotes"
      );

      saveCart();
      renderCart();
      renderMaterials();

      if (buttonText) {
        buttonText.textContent =
          "Order Submitted ✓";
      }

      setTimeout(
        () => {
          if (buttonText) {
            buttonText.textContent =
              "Submit Order";
          }
        },
        2500
      );

    } catch (error) {
      console.error(error);

      submitStatus.className =
        "submit-status error";

      submitStatus.textContent =
        error.message ||
        "Unable to submit the order.";

      if (buttonText) {
        buttonText.textContent =
          "Submit Order";
      }

    } finally {
      submitOrderButton.disabled =
        false;
    }
  }
);

try {
  const saved =
    JSON.parse(
      localStorage.getItem(
        "koruxaMarketCart"
      ) || "{}"
    );

  if (
    saved &&
    typeof saved === "object" &&
    !Array.isArray(saved)
  ) {
    state.cart = saved;
  }

} catch {
  state.cart = {};
}

customerName.value =
  localStorage.getItem(
    "koruxaCustomerName"
  ) || "";

orderNotes.value =
  localStorage.getItem(
    "koruxaOrderNotes"
  ) || "";

normalizeCart();
saveCart();
renderMaterials();
renderCart();
