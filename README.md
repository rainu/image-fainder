# image-fainder

![](./public/logo/384x384.png)

A **local** AI powered image finder application.

With this web application you can scan a **local** directory for images and search by text **similar** images.
The images will not leave your computer, the search is done locally. 
Only the pre-trained model is downloaded from the internet.

## How to use

1. Navigate to [image-fainder](https://rainu.github.io/image-fainder/)
2. Choose your image directory
3. Analyse the images (must be done only once)
4. Search for similar images

## Browser support

At the moment not all browsers are supported. The application will check if your browser is supported automatically.
If your browser is not supported, you will see a corresponding message.

### GPU support

The pre-trained model will be executed on your device! AI models perform much better on GPUs than on CPUs. Therefore,
you want to have a GPU in your device and a browser that **supports GPU acceleration**! CPU only devices will work, but
the performance will be much worse. The application will indicate if your browser supports GPU acceleration by showing
a success icon in the top right corner. If there is a warning icon, your browser does not support GPU acceleration and 
the application switches to CPU mode.

The application is tested with chrome browser. Other browsers may work, but are not tested.

#### Chrome GPU support

To activate GPU support in chrome, you have to enable the following flags:
* `chrome://flags/#enable-vulkan`
* `chrome://flags/#enable-unsafe-webgpu`

## How it works

The application uses a [pre-trained model](https://huggingface.co/jinaai/jina-clip-v1) to extract embeddings from the images.
After that, the search term will also be converted to an embedding and will be compared to the embeddings of the images.
The images with the highest similarity then will be shown.

The images **will not** be uploaded to the internet, the search is done **locally**! The pre-trained model will be
downloaded from the internet and **run on your** device. The image embeddings will be stored in a local database (indexedDB).
Also the search term will be converted to an embedding **locally**. 