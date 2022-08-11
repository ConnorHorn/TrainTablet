<script>
    import {diagnostics} from "./stores";
</script>

<svg width=600 height=330 class="fixed">
    <rect width=600 height=330 style="fill:none;stroke-width:10;stroke:dodgerblue"/>
</svg>

<div class="ml-[20px] mt-[20px] font-bold text-2xl">
    {#each $diagnostics as diagnostic}
        <li class="text-error">{diagnostic}</li>
    {/each}
</div>

